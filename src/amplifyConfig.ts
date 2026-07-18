// Amplify Configuration - Using amplify_outputs.json
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

console.log('🔧 Configuring Amplify from amplify_outputs.json...');

Amplify.configure(outputs);

console.log('✅ Amplify configured successfully!');

export default {};
