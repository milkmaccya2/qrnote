import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.AWS_S3_BUCKET_NAME = 'test-bucket'
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'