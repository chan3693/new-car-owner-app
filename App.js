import 'expo-dev-client';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/FirebaseConfig';
import { initializeNotifications } from './services/NotificationService';
import { unsubscribeFromTopic } from './services/NotificationService';

import SignInScreen from './screens/SignInScreen';
import ListingScreen from './screens/ListingScreen';
import BookingScreen from './screens/BookingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null)

  useEffect(()=>{
    chechAuth();
  },[]);

  const chechAuth = ()=>{
    try {
      onAuthStateChanged(auth, async (user) => {
        if(user){
          setInitialRoute('Listing Screen');
          await initializeNotifications();
        }else{
          setInitialRoute('Sign In Screen');
        }
      });
    }catch(err){
      console.log(`Error while checking auth : ${err}`)
      setInitialRoute('Sign In Screen');
    }
  }

 //function perform logout
 const performLogout = async({navigation}) => {
  try{
    await signOut(auth);
    await unsubscribeFromTopic('New-Booking')
    console.log(`logged out`)
    setInitialRoute('Sign In Screen');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Sign In Screen' }]
    })
  }catch(err){
    console.log(`Error while signing out : ${err}`);
  }
}

  if( initialRoute === null){
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large"/>
      </View>
    )
  }

  return (
    <NavigationContainer>
    <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={ () => ({
            headerStyle: {backgroundColor: '#d6cabc'},
            headerTintColor: '#000',
            headerTitleStyle: {fontWeight: 'bold'},
            headerTitleAlign: 'center'
        
        }) 
      }
    >
     <Stack.Group screenOptions={({ navigation }) => ({
      headerRight: () => (
        <TouchableOpacity onPress={() => {
            //perform logout
            performLogout({navigation})
          }
        } 
        >
          <Icon name="exit" size={35} color="black" />
        </TouchableOpacity>
      ) 
    })}>
      <Stack.Screen 
        component={SignInScreen} 
        name="Sign In Screen" 
        options={{headerTitle: 'Car Owner App', headerRight: () => null}}
      />
      <Stack.Screen 
        component={ListingScreen} 
        name="Listing Screen" 
        initialParams={{userId: auth.currentUser?.uid}}
      />
      <Stack.Screen 
        component={BookingScreen} 
        name='Booking Screen'
      />
    </Stack.Group>
    
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
