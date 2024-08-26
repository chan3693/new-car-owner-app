import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch } from "react-native";

import { db } from "../config/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

const SignInScreen = ( {navigation} ) => {

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