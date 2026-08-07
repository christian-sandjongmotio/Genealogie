ALTER TABLE persons ADD COLUMN parent_id BIGINT REFERENCES persons(id);
ALTER TABLE persons ADD COLUMN source_reference VARCHAR(100);
CREATE UNIQUE INDEX persons_source_reference_unique ON persons(source_reference) WHERE source_reference IS NOT NULL;
