CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conveyancers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    identity_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Available', 'Sold', 'Pending')),
    listing_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('Purchase', 'Sale')) NOT NULL,
    date DATE NOT NULL,
    buyer_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    ordered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_documents_transaction_id ON documents(transaction_id);
CREATE INDEX idx_contracts_transaction_id ON contracts(transaction_id);


-- Insert a sample tenant
INSERT INTO tenants (id, name, domain) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'NSW Conveyancers Pty Ltd', 'nswconveyancers.com.au');

-- Insert a sample conveyancer
INSERT INTO conveyancers (id, tenant_id, name, email, password_hash) VALUES
  ('b2c3d4e5-f6a1-7890-bcde-1234567890ef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John Doe', 'john@nswconveyancers.com.au', 'hashed_password_here');

-- Insert a sample client
INSERT INTO clients (id, tenant_id, name, email, phone, identity_verified) VALUES
  ('c3d4e5f6-a1b2-7890-cdef-34567890abcd', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jane Smith', 'jane@example.com', '0412345678', TRUE);

-- Insert a sample property
INSERT INTO properties (id, tenant_id, address, status, listing_price) VALUES
  ('d4e5f6a1-b2c3-7890-def0-4567890abcde', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123 Sydney Street, Sydney NSW', 'Available', 1200000.00);

-- Insert a sample transaction
INSERT INTO transactions (id, tenant_id, conveyancer_id, property_id, type, date, buyer_id, amount, status) VALUES
  ('e5f6a1b2-c3d4-7890-ef01-567890abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a1-7890-bcde-1234567890ef', 'd4e5f6a1-b2c3-7890-def0-4567890abcde', 'Purchase', '2024-02-13', 'c3d4e5f6-a1b2-7890-cdef-34567890abcd', 1200000.00, 'Pending');

-- Insert a sample document
INSERT INTO documents (id, transaction_id, tenant_id, conveyancer_id, name, file_path) VALUES
  ('f6a1b2c3-d4e5-7890-f012-67890abcdef1', 'e5f6a1b2-c3d4-7890-ef01-567890abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a1-7890-bcde-1234567890ef', 'Contract of Sale.pdf', '/uploads/contracts/contract_123.pdf');

-- Insert a sample contract
INSERT INTO contracts (id, transaction_id, file_path, version) VALUES
  ('g7a1b2c3-d4e5-7890-f012-67890abcdef2', 'e5f6a1b2-c3d4-7890-ef01-567890abcdef', '/uploads/contracts/contract_123_v1.pdf', 1);
