#[cfg(test)]
mod tests {
    use bson::Document;
    use mongodb::{
        bson::{self, doc},
        sync::Client,
    };
    use serde::Deserialize;
    use serde::Serialize;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    use mongodb::sync::Collection;

    #[test]
    fn it_works() -> mongodb::error::Result<()> {
        // Replace the placeholder with your Atlas connection string
        let uri = "mongodb://root:E8kHTYJca96gEC@mongo:27017";
        // Create a new client and connect to the server
        let client = Client::with_uri_str(uri)?;
        // Get a handle on the movies collection
        let database = client.database("peer_discovery");
        let collection: Collection<Document> = database.collection("ip_dictionary");

        // 创建一个文档并插入集合
        let document = doc! {
            "_id": "192.168.0.1",
            "peers": [
                doc! {
                    "id": "peer1",
                    "last_seen": 1598211688000_i64
                }
            ]
        };
        collection.insert_one(document, None)?;

        // 更新文档，向集合中添加值
        let filter = doc! { "_id": "192.168.0.1" };
        let update = doc! { "$push": { "peers": {
            "id": "peer2",
            "last_seen": 1698211789000_i64
        } } };
        collection.update_one(filter, update, None)?;

        // 删除 10000s 前的文档
        let ten_seconds_ago = SystemTime::now() - Duration::from_secs(10000);
        let timestamp = ten_seconds_ago
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis();
        println!("Delete before {}", timestamp);
        collection.delete_many(
            doc! {
                "peers": {
                    "$elemMatch": {
                        "last_seen": {
                            "$lt": i64::try_from(timestamp).expect("connvert to i64 failed")
                        }
                    }
                }
            },
            None,
        )?;

        // 获取文档
        let filter = doc! { "_id": "192.168.0.1" };
        if let Some(document) = collection.find_one(filter, None)? {
            let peers = document.get("peers").and_then(|value| value.as_array());
            if let Some(peers) = peers {
                for peer in peers {
                    if let Some(peer_doc) = peer.as_document() {
                        let id = peer_doc.get("id").and_then(|value| value.as_str());
                        let last_seen = peer_doc.get("last_seen").and_then(|value| value.as_i64());
                        if let (Some(id), Some(last_seen)) = (id, last_seen) {
                            println!("ID: {}, Last Seen: {}", id, last_seen);
                        }
                    }
                }
            }
        }

        collection.delete_many(doc!{}, None)?;

        Ok(())

    }
}
