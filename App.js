import 'expo-dev-client';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator} from 'react-native';
import { CommonActions, NavigationContainer, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/FirebaseConfig';

import SignInScreen from './screens/SignInScreen';
import ListingScreen from './screens/ListingScreen';
import BookingScreen from './screens/BookingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null)

  useEffect(()=>{
    chechAuth();
  },[]);

  const chechAuth = ()=>{
    try {
      onAuthStateChanged(auth, (user) => {
        if(user){
          setInitialRoute('Listing Screen');
          AsyncStorage.setItem('userId', user.uid)
          console.log(`saved userId to AsyncStorage : ${user.uid}`)
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
    await signOut(auth)
    console.log(`logged out`)
    await AsyncStorage.removeItem('userId')
    console.log(`removed userId from AsyncStorage`)
    setInitialRoute('Sign In Screen');
    
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Sign In Screen' }]
      })
    )
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
      <Stack.Screen component={ListingScreen} name="Listing Screen"/>
      <Stack.Screen component={BookingScreen} name='Booking Screen'/>    
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
