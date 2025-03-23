export function validateEnv() {
  const requiredEnvVars = [
    // Database
    'DATABASE_URL',
    
    // NextAuth
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    
    // AWS S3
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET_NAME',
    
    // API Keys
    // Remove this line
    // 'OPENAI_API_KEY',
    'HAZLETTS_API_KEY',
    'VOI_API_KEY',
  ];
  
  // Rest of the function remains the same
}