ALTER TABLE persons ADD COLUMN spouse_id BIGINT REFERENCES persons(id);
UPDATE persons SET spouse_id=2 WHERE id=1;
UPDATE persons SET spouse_id=1 WHERE id=2;
UPDATE persons SET spouse_id=4 WHERE id=3;
UPDATE persons SET spouse_id=3 WHERE id=4;
UPDATE persons SET spouse_id=6 WHERE id=5;
UPDATE persons SET spouse_id=5 WHERE id=6;
