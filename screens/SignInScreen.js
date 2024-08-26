import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../config/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../config/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

const SignInScreen = ( {navigation} ) => {
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false)

    useEffect(()=>{
        loadUserData();
    }, [])

    // load the saved user to interface
    const loadUserData = async()=>{
        try{
            const savedEmail = await AsyncStorage.getItem('emailAddress')
            const savedPassword = await AsyncStorage.getItem('password')
            if (savedEmail && savedPassword) {
                setEmailAddress(savedEmail)
                setPassword(savedPassword)
                setRememberMe(true)
                console.log(`Loaded user data : ${savedEmail}`)
            }
        }catch(err){
            console.log(`Error while loading user data : ${err}`)
        }
    }

    //store the user email and pw
    const saveUserData = async (email, pw) => {
        try {
            await AsyncStorage.setItem('emailAddress', email)
            await AsyncStorage.setItem('password', pw)
            console.log(`Saved user data : ${email}`)
        } catch (err) {
            console.log(`Error while saving user data : ${err}`)
        }
    }

    //clear the user email and pw
    const clearUserData = async()=>{
        try {
            await AsyncStorage.removeItem('emailAddress')
            await AsyncStorage.removeItem('password')
            console.log(`Cleared user data`)
        } catch (err){
            console.log(`Error while clearing user id : ${err}`)
        }
    } 

    //check the user if exist in db
    const checkUser = async (docId) =>{
        try {
            const docRef = doc(db, "Car Owner DB", docId)
            const querySnapshot = await getDoc(docRef)

            if (querySnapshot.exists()){
                console.log("User found in Car Owner DB")
                return true
            }else{
                console.log("User not found in Car Owner DB")
                return false
            }
        }catch (err) {
            console.log(`Error while checking user in DB : ${err}`)
            return false
        }
    }   

    //sign in function
    const signInUser = async (email, pw)=>{
        try{
            const userCredentials = await signInWithEmailAndPassword(auth, email, pw)
            const userId = userCredentials.user.uid;
            console.log(`userCredentials id : ${userId}`)

            const userInDb = await checkUser(userId)
            if (userInDb) {
                if (rememberMe){
                    await saveUserData(email, pw);
                }else{
                    await clearUserData();
                }

                navigation.replace("Listing Screen")

                // Request notification permissions
                // await requestNotificationPermissions();

                console.log(`Signed In successfully`)
            } else {
                console.log("User is not authorized to access")
                Alert.alert("User is not authorized to access")
            }
        }catch(err){
            console.log(`Error while signing in : ${err}`)
            Alert.alert("Invalid email or password", "Invalid email or password")
        }
    }

    //perform sign in action while chicked button
    const onSignInClicked = async () => {
        console.log(`sign in clicked`);
       
        if (!emailAddress || !password){
            console.log("empty email and password")
            Alert.alert("Please input email and password")
            return;
        }
        await signInUser(emailAddress, password);
    }

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Sign In your account</Text>
            <TextInput 
                style={styles.inputStyle}
                placeholder="Enter Username"
                textContentType="emailAddress"
                autoCapitalize="none"
                returnKeyType="next"
                value={emailAddress}
                onChangeText={setEmailAddress}
            />

            <TextInput 
                style={styles.inputStyle}
                placeholder="Enter Password"
                textContentType="password"
                autoCapitalize="none"
                returnKeyType="done"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.buttonStyle} onPress={onSignInClicked}>
                <Text style={styles.buttonTextStyle}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
                <Text>Remember Me</Text>
                <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                />
            </View>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'flex-start',
        padding: 14,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        margin: 12,
        textAlign: 'center'
    },
    inputStyle : {
        height: 50,
        margin: 10,
        padding: 5,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        fontSize: 20
    },
    buttonStyle: {
        height: 50,
        margin: 10,
        padding: 5,
        borderRadius: 5,
        backgroundColor:'#d6cabc',
        justifyContent:'center',
        alignItems:'center',
    },
    buttonTextStyle: {
        fontWeight: 'bold',
        color:'#000',
        fontSize: 20
    },
    switchContainer: {
        alignItems: 'flex-end',
        marginTop: 10,
        marginRight: 10
    }
});

export default SignInScreen;