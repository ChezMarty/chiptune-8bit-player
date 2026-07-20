use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::Rng;
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};
use url::Url;

use super::models::{SpotifyAccountStatus, SpotifyUser, StoredTokens, TokenResponse};

/// Spotify OAuth configuration — just the client ID.
/// The redirect URI is dynamic (ephemeral port), not fixed.
#[derive(Clone)]
pub struct SpotifyAuthConfig {
    pub client_id: String,
}

/// Represents a completed OAuth token exchange result.
pub struct AuthResult {
    pub tokens: StoredTokens,
    pub user: SpotifyUser,
}

/// Generate a cryptographically random code verifier (43-128 chars, unreserved).
pub fn generate_code_verifier() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..64).map(|_| rng.gen()).collect();
    URL_SAFE_NO_PAD.encode(&bytes)
}

/// Generate a code challenge from a verifier using S256 (SHA-256 + base64url).
pub fn generate_code_challenge(verifier: &str) -> String {
    let hash = Sha256::digest(verifier.as_bytes());
    URL_SAFE_NO_PAD.encode(&hash)
}

/// Build the Spotify authorization URL for the PKCE flow.
pub fn build_authorize_url(
    client_id: &str,
    redirect_uri: &str,
    code_challenge: &str,
) -> String {
    let scopes = [
        "user-read-private",
        "user-read-email",
        "user-library-read",
        "user-library-modify",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-recently-played",
        "user-top-read",
        "streaming",
    ]
    .join(" ");

    let state = generate_state();

    let mut url = Url::parse("https://accounts.spotify.com/authorize").unwrap();
    {
        let mut q = url.query_pairs_mut();
        q.append_pair("client_id", client_id);
        q.append_pair("response_type", "code");
        q.append_pair("redirect_uri", redirect_uri);
        q.append_pair("code_challenge_method", "S256");
        q.append_pair("code_challenge", code_challenge);
        q.append_pair("scope", &scopes);
        q.append_pair("state", &state);
    }
    url.to_string()
}

fn generate_state() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..16).map(|_| rng.gen()).collect();
    URL_SAFE_NO_PAD.encode(&bytes)
}

/// Exchange the authorization code for tokens.
pub async fn exchange_code(
    client_id: &str,
    redirect_uri: &str,
    code: &str,
    code_verifier: &str,
) -> Result<AuthResult, String> {
    let client = reqwest::Client::new();

    let params = [
        ("grant_type", "authorization_code"),
        ("code", code),
        ("redirect_uri", redirect_uri),
        ("client_id", client_id),
        ("code_verifier", code_verifier),
    ];

    let resp = client
        .post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token request failed: {e}"))?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {body}"));
    }

    let token: TokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("Token parse failed: {e}"))?;

    let refresh_token = token
        .refresh_token
        .clone()
        .ok_or_else(|| "No refresh token in response".to_string())?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let stored = StoredTokens {
        access_token: token.access_token.clone(),
        refresh_token,
        expires_at: now + token.expires_in.saturating_sub(60),
        scope: token.scope,
    };

    let user = super::api::SpotifyApiClient::new()
        .get_me(&token.access_token)
        .await?;

    Ok(AuthResult {
        tokens: stored,
        user,
    })
}

/// Refresh an expired access token using the refresh token.
pub async fn refresh_access_token(
    client_id: &str,
    refresh_token: &str,
) -> Result<StoredTokens, String> {
    let client = reqwest::Client::new();

    let params = [
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token),
        ("client_id", client_id),
    ];

    let resp = client
        .post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Refresh request failed: {e}"))?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {body}"));
    }

    let token: TokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("Token parse failed: {e}"))?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(StoredTokens {
        access_token: token.access_token,
        refresh_token: token.refresh_token.unwrap_or_else(|| refresh_token.to_string()),
        expires_at: now + token.expires_in.saturating_sub(60),
        scope: token.scope,
    })
}

// ── Dynamic-port callback server ─────────────────────────────────

/// Bind a TCP listener on an OS-assigned ephemeral port (127.0.0.1:0).
/// Returns the bound listener and the actual port number.
/// Retries up to 3 times if binding fails.
pub async fn bind_callback_server() -> Result<(tokio::net::TcpListener, u16), String> {
    for attempt in 1..=3 {
        match tokio::net::TcpListener::bind("127.0.0.1:0").await {
            Ok(listener) => {
                let port = listener
                    .local_addr()
                    .map_err(|e| format!("Failed to get local addr: {e}"))?
                    .port();
                eprintln!("[spotify] Callback server bound to port {port} (attempt {attempt})");
                return Ok((listener, port));
            }
            Err(e) if attempt < 3 => {
                eprintln!("[spotify] Bind attempt {attempt} failed: {e}, retrying...");
            }
            Err(e) => {
                return Err(format!(
                    "Failed to bind callback server after {attempt} attempts: {e}"
                ));
            }
        }
    }
    unreachable!()
}

/// Accept one HTTP connection on the pre-bound listener, extract the
/// authorization code from the callback URL, and return it.
///
/// The listener is consumed by this function. Dropping it frees the port.
pub async fn accept_callback(listener: tokio::net::TcpListener) -> Result<String, String> {
    let (mut stream, _) = listener
        .accept()
        .await
        .map_err(|e| format!("Accept failed: {e}"))?;

    let mut buf = vec![0u8; 4096];
    let n = tokio::io::AsyncReadExt::read(&mut stream, &mut buf)
        .await
        .map_err(|e| format!("Read failed: {e}"))?;

    let request = String::from_utf8_lossy(&buf[..n]);
    let request_line = request.lines().next().unwrap_or("");

    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Err("Invalid HTTP request".to_string());
    }

    let path = parts[1];
    eprintln!("[spotify] Callback received: {path}");
    let url = Url::parse(&format!("http://localhost{path}"))
        .map_err(|e| format!("Parse callback URL: {e}"))?;

    let error = url.query_pairs().find(|(k, _)| k == "error");
    if let Some((_, err_val)) = error {
        send_response(
            &mut stream,
            "text/html",
            &format!(
                "<html><body><h1>Authorization Denied</h1><p>{err_val}</p></body></html>"
            ),
        )
        .await?;
        return Err(format!("Authorization denied: {err_val}"));
    }

    let code = url
        .query_pairs()
        .find(|(k, _)| k == "code")
        .map(|(_, v)| v.to_string())
        .ok_or_else(|| "No authorization code in callback".to_string())?;

    send_response(
        &mut stream,
        "text/html",
        "<html><head><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0D0D1A;color:#4EE2EC}div{text-align:center}h1{font-size:24px}p{font-size:14px;color:#8B8FA4}</style></head><body><div><h1>✅ Connected!</h1><p>You can close this window and return to Chiptune &amp; Bits.</p></div></body></html>",
    )
    .await?;

    Ok(code)
}

async fn send_response(
    stream: &mut tokio::net::TcpStream,
    content_type: &str,
    body: &str,
) -> Result<(), String> {
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: {content_type}; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    tokio::io::AsyncWriteExt::write_all(stream, response.as_bytes())
        .await
        .map_err(|e| format!("Write response: {e}"))?;
    Ok(())
}

/// Build the account status from tokens and user profile.
pub fn build_account_status(
    tokens: Option<&StoredTokens>,
    cached_user: Option<&SpotifyUser>,
) -> SpotifyAccountStatus {
    match (tokens, cached_user) {
        (Some(_), Some(user)) => SpotifyAccountStatus {
            connected: true,
            user_id: Some(user.id.clone()),
            display_name: user.display_name.clone(),
            email: user.email.clone(),
            product: user.product.clone(),
            image_url: user.images.first().map(|i| i.url.clone()),
        },
        (Some(_), None) => SpotifyAccountStatus {
            connected: true,
            user_id: None,
            display_name: None,
            email: None,
            product: None,
            image_url: None,
        },
        (None, _) => SpotifyAccountStatus {
            connected: false,
            user_id: None,
            display_name: None,
            email: None,
            product: None,
            image_url: None,
        },
    }
}
