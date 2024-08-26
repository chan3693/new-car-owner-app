import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {PermissionsAndroid} from 'react-native';

export async function requestUserPermission() {
    try{
        if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
            if (enabled) {
              console.log('Authorization status:', authStatus);
            }
        }
        if (Platform.OS === 'android') {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
    }catch(err){
        console.log(`Error while requesting notification permissions : ${err}`)
    }
  }