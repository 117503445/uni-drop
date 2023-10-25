use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Record{
    pub peer_id: String,
    pub ipv4: String,
    pub ipv6: String,
    pub last_seen: i64,
}