mod model;

use rand::Rng;

use futures::stream::StreamExt;
use model::Record;
use model::Pin;
use mongodb::{
    bson:: doc,
    options::{ FindOneAndUpdateOptions, IndexOptions},
    IndexModel,
};
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
    collection: mongodb::Collection<Record>,
}

impl RecordService {
    pub fn new(
        client: mongodb::Client,
        db_name: &str
    ) -> Self {
        let collection = client.database(db_name).collection::<Record>("records");
        Self {
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

    // remove records, except `remain` latest records
    pub async fn remove_remain(&self, remain: u64) -> Result<(), Box<dyn Error>> {
        let mut cursor = self.collection
            .find(
                doc! {},
                None,
            )
            .await?;

        let mut records: Vec<Record> = Vec::new();
        while let Some(result) = cursor.next().await {
            match result {
                Ok(record) => {
                    records.push(record);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }

        records.sort_by(|a, b| b.last_seen.cmp(&a.last_seen));
        let mut peer_ids: Vec<String> = Vec::new();
        for record in records.into_iter().skip(remain as usize) {
            peer_ids.push(record.peer_id);
        }

        self.collection
            .delete_many(
                doc! { "peer_id": { "$in": peer_ids } },
                None,
            )
            .await?;
        Ok(())
    }

    // ipv4
    pub async fn get_peers_by_ip(&self, ipv4: &str, ipv6: &str) -> Result<Vec<String>, Box<dyn Error>> {
        let mut peer_ids: Vec<String> = Vec::new();
        let mut cursor = self.collection
            .find(
                doc! { "$or": [
                    { "ipv4": ipv4 },
                    // not use ipv6
                    // { "ipv6": ipv6 },
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


#[derive(Clone)]
pub struct PinService {
    collection: mongodb::Collection<Pin>,
}
impl PinService {
    pub fn new(
        client: mongodb::Client,
        db_name: &str,
    ) -> Self {
        let collection = client.database(db_name).collection::<Pin>("pins");
        Self {
            collection,
        }
    }
    pub async fn remove_expired(&self, peer_timeout_seconds: u64)-> Result<(), Box<dyn Error>>{
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

    // same peer_id and pin_code, update last_seen
    // same peer_id, but different pin_code, update pin_code and last_seen
    // different peer_id, but same pin_code, error
    // different peer_id and pin_code, insert
    pub async fn upsert(
        &self,
        peer_id: &str,
        pin_code: &str,
        last_seen: Option<i64>
    ) -> Result<(), Box<dyn Error>> {
        let options = FindOneAndUpdateOptions::builder()
            .upsert(Some(true))
            .build();
        
       let document = self.collection
            .find_one(
                doc! { "pin_code": pin_code },
                None,
            ).await?;
        if document.is_some() {
            let document = document.unwrap();
            if document.peer_id == peer_id {
                self.collection
                .find_one_and_update(
                    doc! { "pin_code": pin_code },
                    doc! { "$set": {
                        "last_seen": last_seen.unwrap_or(get_timestamp(SystemTime::now())),
                    }},
                    options,
                )
                .await?;
            }else{
                return Err(Box::new(MyError::new(String::from("pin_code is used"))))
            }
        }
        
        let options = FindOneAndUpdateOptions::builder()
            .upsert(Some(true))
            .build();
        self.collection
            .find_one_and_update(
                doc! { "peer_id": peer_id },
                doc! { "$set": {
                    "pin_code": pin_code,
                    "last_seen": last_seen.unwrap_or(get_timestamp(SystemTime::now())),
                }},
                options,
            )
            .await?;
        Ok(())
    }

    pub async fn get_peerid_by_pin(&self, pin_code: &str) -> Result<String, Box<dyn Error>> {
        let mut cursor = self.collection
            .find(
                doc! { "pin_code": pin_code },
                None,
            )
            .await?;

        while let Some(result) = cursor.next().await {
            match result {
                Ok(pin) => {
                    return Ok(pin.peer_id);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }
        return Err(Box::new(MyError::new(String::from("pin_code not found"))))
    }

    pub async fn get_pin_by_peerid(&self, peer_id: &str) -> Result<Option<String>, Box<dyn Error>> {
        let mut cursor = self.collection
            .find(
                doc! { "peer_id": peer_id },
                None,
            )
            .await?;

        while let Some(result) = cursor.next().await {
            match result {
                Ok(pin) => {
                    return Ok(Some(pin.pin_code));
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }
        Ok(None)
    }

    // create index for pin_code and peer_id separately
    pub async fn create_index(&self) -> Result<(), Box<dyn Error>> {
        let options = IndexOptions::builder().unique(true).build();
        let model = IndexModel::builder()
            .keys(doc! { "pin_code": 1 })
            .options(options)
            .build();
        self.collection.create_index(model, None).await?;

        let options = IndexOptions::builder().unique(true).build();
        let model = IndexModel::builder()
            .keys(doc! { "peer_id": 1 })
            .options(options)
            .build();
        self.collection.create_index(model, None).await?;
        Ok(())
    }

    pub async fn get_available_pin_code(&self) -> Result<String, Box<dyn Error>> {
        let mut cursor = self.collection
            .find(
                doc! {},
                None,
            )
            .await?;

        let mut pin_codes: Vec<String> = Vec::new();
        while let Some(result) = cursor.next().await {
            match result {
                Ok(pin) => {
                    pin_codes.push(pin.pin_code);
                }
                Err(err) => {
                    return Err(Box::new(err));
                }
            }
        }

        let mut pin_code = self.gen_pin_code();
        // TODO: if pin_codes.len() == 10000, dead loop; too slow
        while pin_codes.contains(&pin_code) {
            pin_code = self.gen_pin_code();
        }
        Ok(pin_code)
    }

    // pin_code from 0000 to 9999
    pub fn gen_pin_code(&self) -> String {
        let mut rng = rand::thread_rng();
        let pin_code = rng.gen_range(0..10000);
        format!("{:04}", pin_code)
    }

    pub async fn remove_all(&self) -> Result<(), Box<dyn Error>> {
        self.collection.delete_many(doc! {}, None).await?;
        Ok(())
    }

}

#[derive(Debug)]
struct MyError {
    message: String,
}

impl MyError {
    fn new(message: String) -> Self {
        MyError { message }
    }
}
impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}
impl Error for MyError {}