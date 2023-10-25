mod model;

use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use futures::{
    future::ok,
    stream::{StreamExt, TryStreamExt},
};
use model::{Record, User};
use mongodb::{
    bson::{de, doc},
    options::{ClientOptions, FindOneAndUpdateOptions, IndexOptions},
    Client, Collection, IndexModel,
};
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

pub fn get_timestamp(start: SystemTime) -> i64 {
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    since_the_epoch.as_millis() as i64
}

#[derive(Clone)]
pub struct RecordService {
    client: mongodb::Client,
    collection: mongodb::Collection<Record>,
}

impl RecordService {
    pub fn new(
        client: mongodb::Client,
        db_name: &str,
        coll_name: &str,
    ) -> Self {
        let collection = client.database(db_name).collection::<Record>(coll_name);
        Self {
            client,
            collection,
        }
    }
    pub async fn create_peerid_index(&self) -> Result<(), Box<dyn Error>> {
        let options = IndexOptions::builder().unique(true).build();
        let model = IndexModel::builder()
            .keys(doc! { "peer_id": 1 })
            .options(options)
            .build();

        self.collection.create_index(model, None).await?;
        Ok(())
    }

    // if exists, update; if not exists, insert
    pub async fn upsert(
        &self,
        peer_id: &str,
        ipv4: &str,
        ipv6: &str,
        last_seen: Option<i64>
    ) -> Result<(), Box<dyn Error>> {
        let options = FindOneAndUpdateOptions::builder()
            .upsert(Some(true))
            .build();

        self.collection
            .find_one_and_update(
                doc! { "peer_id": peer_id },
                doc! { "$set": {
                    "ipv4": ipv4,
                    "ipv6": ipv6,
                    "last_seen": last_seen.unwrap_or(get_timestamp(SystemTime::now())),
                }},
                options,
            )
            .await?;
        Ok(())
    }
    pub async fn remove_expired(&self, peer_timeout_seconds: u64) -> Result<(), Box<dyn Error>> {
        self.collection
        .delete_many(
            doc! { 
                "last_seen":
                 { "$lt": get_timestamp(SystemTime::now() - Duration::from_secs(peer_timeout_seconds)) 
                } 
            }, None)
        .await?;
        Ok(())
    }
    // ipv4 or ipv6
    pub async fn get_peers_by_ip(&self, ipv4: &str, ipv6: &str) -> Result<Vec<String>, Box<dyn Error>> {
        let mut peer_ids: Vec<String> = Vec::new();
        let mut cursor = self.collection
            .find(
                doc! { "$or": [
                    { "ipv4": ipv4 },
                    { "ipv6": ipv6 },
                ] },
                None,
            )
            .await?;

        while let Some(result) = cursor.next().await {
            match result {
                Ok(record) => {
                    peer_ids.push(record.peer_id);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }
        Ok(peer_ids)
    }
    pub async fn remove_all(&self) -> Result<(), Box<dyn Error>> {
        self.collection.delete_many(doc! {}, None).await?;
        Ok(())
    }
}
