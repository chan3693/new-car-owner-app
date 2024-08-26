import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {PermissionsAndroid} from 'react-native';
import { Alert } from 'react-native';

// Request permission for notifications
async function requestUserPermission() {
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

// Get FCM token
async function getToken() {
  try{
    if (requestUserPermission){
      const token = await messaging().getToken()
      console.log(`TCM Token : ${token}`)
    }
  }catch(err){
    console.log(`Error while getting FCM Token : ${err}`)
  }
}

async function subscribeToTopic(topic) {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (err) {
    console.log(`Error while subscribing to topic: ${err}`);
  }
}

export async function unsubscribeFromTopic(topic) {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (err) {
    console.log(`Error while unsubscribing from topic: ${err}`);
  }
}

// Register background handler
function setBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
}

function setForegroundMessageHandler() {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification.title, 
      remoteMessage.notification.body,
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
      { cancelable: false }
    )
  });
  return unsubscribe;
}

// Handle notifications when the app is opened from a quit state
async function getInitialNotification() {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    console.log(`App opened from quit state by notification : ${remoteMessage}`)
  }
}

// Handle notifications when the app is in the background and opened by the user
function onNotificationOpenedApp() {
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(`App opend from background by notification : ${remoteMessage}`)
  });
}

export async function initializeNotifications() {
  await requestUserPermission();
  await getToken();
  await subscribeToTopic('New-Booking')
  setBackgroundMessageHandler();
  setForegroundMessageHandler();
  // await getInitialNotification();
  // onNotificationOpenedApp();
}