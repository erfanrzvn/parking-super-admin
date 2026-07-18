// Amplify Configuration - Gen 1 format (stable)
import { Amplify } from 'aws-amplify';

console.log('🔧 Configuring Amplify from amplifyConfig.ts...');

const config = {
  aws_project_region: 'ca-central-1',
  
  // Cognito Configuration
  aws_cognito_region: 'ca-central-1',
  aws_user_pools_id: 'ca-central-1_UecP7kd1N',
  aws_user_pools_web_client_id: '7ckai37tgmnlqeeq5i4ujvkm6n',
  aws_cognito_identity_pool_id: 'ca-central-1:a47d9621-3bf4-48ff-8560-f350e18bbb99',
  
  // Auth Configuration
  oauth: {},
  
  // AppSync Configuration
  aws_appsync_graphqlEndpoint: 'https://dp457mgtrvdkfod6o6mmhpoy74.appsync-api.ca-central-1.amazonaws.com/graphql',
  aws_appsync_region: 'ca-central-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_appsync_apiKey: 'da2-jjcraxop5bgjvdtm2k4iupt64e'
};

Amplify.configure(config);

console.log('✅ Amplify configured successfully from amplifyConfig.ts!');

export default {};
