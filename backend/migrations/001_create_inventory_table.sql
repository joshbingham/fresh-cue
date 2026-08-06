CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  quantity NUMERIC NOT NULL CHECK (quantity >= 1),
  quantity_unit TEXT NOT NULL CHECK (
    quantity_unit IN (
      'item',
      'pack',
      'g',
      'kg',
      'ml',
      'l'
    )
  ),
  expiry_date DATE NOT NULL,
  storage_location TEXT NOT NULL CHECK (
    storage_location IN (
      'fridge',
      'freezer',
      'cupboard'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN (
      'active',
      'consumed',
      'wasted',
      'expired'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);