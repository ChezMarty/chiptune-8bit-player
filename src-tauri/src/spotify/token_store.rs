use crate::spotify::models::StoredTokens;

/// Secure token storage using OS credential manager with fallback.
///
/// Priority:
/// 1. OS keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service)
/// 2. Encrypted file in app data directory (fallback for headless Linux or keyring failures)
pub struct TokenStore {
    service_name: String,
}

const KEYRING_USER: &str = "spotify_tokens";

impl TokenStore {
    pub fn new(app_name: &str) -> Self {
        TokenStore {
            service_name: format!("{app_name}-spotify"),
        }
    }

    /// Store tokens securely. Tries OS keyring first, falls back to file.
    pub fn save(&self, tokens: &StoredTokens) -> Result<(), String> {
        let json = serde_json::to_string(tokens).map_err(|e| format!("Serialize: {e}"))?;

        // Try OS keyring first.
        match keyring::Entry::new(&self.service_name, KEYRING_USER) {
            Ok(entry) => {
                match entry.set_password(&json) {
                    Ok(()) => return Ok(()),
                    Err(e) => {
                        eprintln!("[token_store] keyring set failed: {e}, falling back to file");
                    }
                }
            }
            Err(e) => {
                eprintln!("[token_store] keyring unavailable: {e}, using file storage");
            }
        }

        // Fallback: write to app data directory.
        self.save_to_file(&json)
    }

    /// Load tokens securely. Tries OS keyring first, falls back to file.
    pub fn load(&self) -> Result<Option<StoredTokens>, String> {
        // Try OS keyring first.
        if let Ok(entry) = keyring::Entry::new(&self.service_name, KEYRING_USER) {
            match entry.get_password() {
                Ok(json) => {
                    let tokens: StoredTokens =
                        serde_json::from_str(&json).map_err(|e| format!("Deserialize: {e}"))?;
                    return Ok(Some(tokens));
                }
                Err(keyring::Error::NoEntry) => {
                    // No tokens stored in keyring — fall through to file.
                }
                Err(e) => {
                    eprintln!("[token_store] keyring read failed: {e}, trying file fallback");
                }
            }
        }

        // Fallback: read from file.
        self.load_from_file()
    }

    /// Delete stored tokens.
    pub fn delete(&self) -> Result<(), String> {
        // Try OS keyring first.
        if let Ok(entry) = keyring::Entry::new(&self.service_name, KEYRING_USER) {
            let _ = entry.delete_credential();
        }

        // Also delete file fallback.
        let _ = self.delete_file();
        Ok(())
    }

    // ── File-based fallback ──────────────────────────────────────────

    fn file_path(&self) -> Result<std::path::PathBuf, String> {
        let dir = dirs_next().ok_or("Cannot determine app data directory")?;
        std::fs::create_dir_all(&dir).map_err(|e| format!("Create dir: {e}"))?;
        Ok(dir.join(format!("{}.json", self.service_name)))
    }

    fn save_to_file(&self, json: &str) -> Result<(), String> {
        let path = self.file_path()?;
        // Simple XOR obfuscation to avoid plaintext on disk.
        let obfuscated = xor_obfuscate(json.as_bytes());
        std::fs::write(&path, &obfuscated).map_err(|e| format!("Write file: {e}"))
    }

    fn load_from_file(&self) -> Result<Option<StoredTokens>, String> {
        let path = self.file_path()?;
        if !path.exists() {
            return Ok(None);
        }
        let data = std::fs::read(&path).map_err(|e| format!("Read file: {e}"))?;
        let json = String::from_utf8(xor_obfuscate(&data))
            .map_err(|e| format!("Decode: {e}"))?;
        let tokens: StoredTokens =
            serde_json::from_str(&json).map_err(|e| format!("Deserialize: {e}"))?;
        Ok(Some(tokens))
    }

    fn delete_file(&self) -> Result<(), String> {
        let path = self.file_path()?;
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| format!("Delete file: {e}"))?;
        }
        Ok(())
    }
}

fn dirs_next() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA").ok().map(|p| {
            std::path::PathBuf::from(p).join("Chiptune8BitPlayer")
        })
    }
    #[cfg(target_os = "macos")]
    {
        dirs_fallback("HOME", "Library/Application Support/Chiptune8BitPlayer")
    }
    #[cfg(target_os = "linux")]
    {
        dirs_fallback("XDG_DATA_HOME", "Chiptune8BitPlayer")
            .or_else(|| dirs_fallback("HOME", ".local/share/Chiptune8BitPlayer"))
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        None
    }
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
fn dirs_fallback(env_var: &str, suffix: &str) -> Option<std::path::PathBuf> {
    std::env::var(env_var)
        .ok()
        .map(|base| std::path::PathBuf::from(base).join(suffix))
}

fn xor_obfuscate(data: &[u8]) -> Vec<u8> {
    const KEY: &[u8] = b"Ch1pTun3_8b1t_S3cr3tK3y!";
    data.iter()
        .enumerate()
        .map(|(i, b)| b ^ KEY[i % KEY.len()])
        .collect()
}


