import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { db } from '../config/FirebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import * as Location from "expo-location"

const ListingScreen = ({navigation, route}) => {

    const { userId } = route.params;
    console.log(`Listing Screen - routed userId : ${userId}`)
    
    //Vehicle Information:
    const [vehicleMake, setVehicleMake] = useState('')
    const [vehicleModel, setVehicleModel] = useState('')
    const [vehicleName, setVehicleName] = useState('')
    const [vehiclePhoto, setVehiclePhoto] = useState('')
    const [seatingCapacity, setSeatingCapacity] = useState('')
    const [additionalProp1, setAdditionalProp1] = useState('')//model year
    const [additionalProp2, setAdditionalProp2] = useState('')//doors

    //Owner information:
    const [licensePlate, setLicensePlate] = useState('')

    //Rental information:
    const [pickupLocation, setPickupLocation] = useState('')
    const [lat, setLat] = useState(null)
    const [lng, setLng] = useState(null)
    const [city, setCity] = useState(null)
    const [rentalPrice, setRentalPrice] = useState('')

    //Set headerleft options
    useEffect(()=>{
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => {
                    navigation.navigate("Booking Screen", {userId})
                    }}
                >
                    <Text style={{color:'black', fontWeight: 'bold'}}> {`Manage\n Bookings`}</Text>
                </TouchableOpacity>
            )
        })   
    }, [])

    //Fetching API and Search from API handling
    const btnToFindVehicleFromAPI = async () => {
        await fetch('https://chan3693.github.io/ev/vehicles.json')
        .then( (response) => {
            console.log(`Response status : ${response.status}`);
            //check if the response from server is successful
            if (response.ok){
                console.log(`Response okay from server : ${JSON.stringify(response)}`);
                //send the response to the next then() block for processing
                return response.json() //json object of repsonse
            }else{
                console.log(`Unsuccessful response from server : ${response.status}`);
            }
        })
        .then( (jsonData) => {
            console.log(`objects received : ${jsonData.length}`);
            //find matching vehicle from API
            const ifMatchedVehicle = jsonData.find( vehicle => 
                vehicle.make.toLowerCase() === vehicleMake.toLowerCase() &&
                    vehicle.model.toLowerCase() === vehicleModel.toLowerCase()
            )
            console.log(ifMatchedVehicle)
            //store the data from api into state variable
            if (ifMatchedVehicle) {
                setVehicleMake(ifMatchedVehicle.make)
                setVehicleModel(ifMatchedVehicle.model)
                setVehicleName(`${ifMatchedVehicle.make} ${ifMatchedVehicle.model} ${ifMatchedVehicle.trim}`)
                setVehiclePhoto(ifMatchedVehicle.images[0].url_thumbnail)
                setSeatingCapacity(ifMatchedVehicle.seats_max.toString())
                setAdditionalProp1(ifMatchedVehicle.model_year.toString())
                setAdditionalProp2(ifMatchedVehicle.doors.toString())
            }else{
                Alert.alert("Result", "No Matched vehicle found")
            }
        })
        .catch( (error) => { 
            console.log(`Error while connecting to API : ${JSON.stringify(error)}`) 
        })
    }

    //find the lat & lng and city
    const doFwdGeocode = async() => {
        if (!pickupLocation || pickupLocation.trim().length === 0) {
            console.log("Pickup location is empty or invalid");
            Alert.alert("Invalid Address", "Please enter a valid address.");
            return;
        }
        try {
            const geocodedLocations = await Location.geocodeAsync(pickupLocation)

            if (geocodedLocations !== undefined){
                const result = geocodedLocations[0]

                if (result !== undefined){
                    console.log(`lat : ${result.latitude}`)
                    console.log(`lng : ${result.longitude}`)

                    setLat(result.latitude)
                    setLng(result.longitude)

                    // do Reverse Geocode to find the exact city
                    try {
                        //create an object representing location coordinates from user object
                        const coords = {
                            latitude: result.latitude,
                            longitude: result.longitude
                        }
                        console.log(`coords to reverse: ${JSON.stringify(coords)}`);
                        //reverseGeocodeAsync() takes location coordinates object as a parameter and
                        // returns array of any matching postal addresses
                        const postalAddressList = await Location.reverseGeocodeAsync(coords, {})
                        console.log(`postalAddressList : ${JSON.stringify(postalAddressList)}`);
            
                        if (postalAddressList !== undefined){
                            //process the first postal address
                            const addressResult = postalAddressList[0]
            
                            if (addressResult !== undefined){
                                console.log(`doReverseGeocode result : ${JSON.stringify(addressResult)}`);
                                console.log(`doReverseGeocode result.city : ${addressResult.city}`);
                                setCity(addressResult.city)
                            }else{
                                console.log(`doReverseGeocode No address found for given coordinates`);
                            }
                        }else{
                            console.log(`doReverseGeocode No address found for given coordinates`);
                        }
            
                    } catch (error) {
                        console.log(`Error while performing reverse geocoding`);
                    }
                    // end of Reverse Geocode

                }else{
                    console.log(`No location coordinates available for given street address`)
                }
            }else{
                console.log(`No location coordinates available for given street address`)
            }
        }catch(err){
            console.log(`Error while performing forward geocoding : ${err}`);
        }
    }

    useEffect(()=>{
        (async()=>{
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted'){
                Alert.alert('Permission to access location was denied')
                return;
            }
        })();
    },[])

    useEffect(() =>{
        if (pickupLocation && pickupLocation.trim().length > 0) {
            doFwdGeocode()
        }
    }, [pickupLocation])

    // handle btn press and save to db
    const btnToCreatePressed = async () => {
        try {
            if (!vehicleMake || !vehicleModel || !vehicleName || !vehiclePhoto 
                || !seatingCapacity || !additionalProp1 || !additionalProp2 || !licensePlate
                || !pickupLocation || !rentalPrice) {
                    Alert.alert("All fields are required", "All fields are required")
                    return
                }
            if (lat !== null && lng !== null){
                const listingData = {
                    vehicleMake,
                    vehicleModel,
                    vehicleName,
                    vehiclePhoto,
                    seatingCapacity,
                    additionalProp1,
                    additionalProp2,
                    licensePlate,
                    pickupLocation,
                    lat,
                    lng,
                    city,
                    rentalPrice,
                    // isAvailable: true
                    carStatus: "Available"
                }
                console.log(`listingData: ${JSON.stringify(listingData)}`)

                const collectionRef = collection(db, 'Car Owner DB', userId, 'Listing')
                await addDoc(collectionRef, listingData)

                console.log(`Listing created successfully`)
                Alert.alert("Success", "Your Listing was created")

                setVehicleMake('')
                setVehicleModel('')
                setVehicleName('')
                setVehiclePhoto('')
                setSeatingCapacity('')
                setAdditionalProp1('')
                setAdditionalProp2('')
                setLicensePlate('')
                setPickupLocation('')
                setRentalPrice('')
            }else{
                console.log(`Unable to create listing. Geocode not completed.`);
                Alert.alert("Invalid address", "This address is not available. Choose a diffent address.")
            }
        } catch(err){
            console.log(`Error while creating listing : ${err}`)
        }
    }

    return(
        <ScrollView style={{backgroundColor: '#fff6f6'}}>
            <View style={styles.container}>
                <Text style={styles.title}>Create a rental listing for electric vehicle</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.subtitle}>Vehicle Information :</Text>
                    <TextInput
                        value={vehicleMake}
                        onChangeText={setVehicleMake}
                        placeholder="Vehicle Make"
                        style={styles.input}
                    />
                    <TextInput
                        value={vehicleModel}
                        onChangeText={setVehicleModel}
                        placeholder="Vehicle Model"
                        style={styles.input}
                    />
                    <TextInput
                        value={vehicleName}
                        onChangeText={setVehicleName}
                        placeholder="Vehicle Name"
                        style={styles.input}
                    />
                    <TextInput
                        value={vehiclePhoto}
                        onChangeText={setVehiclePhoto}
                        placeholder="Vehicle Photo URL"
                        style={styles.input}
                    />
                    <TextInput
                        value={seatingCapacity}
                        onChangeText={setSeatingCapacity}
                        placeholder="Seating Capacity"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        value={additionalProp1}
                        onChangeText={setAdditionalProp1}
                        placeholder="Additional properties"
                        style={styles.input}
                    />
                    <TextInput
                        value={additionalProp2}
                        onChangeText={setAdditionalProp2}
                        placeholder="Additional properties"
                        style={styles.input}
                    />
                </View>

                <TouchableOpacity style={styles.buttonStyle} onPress={btnToFindVehicleFromAPI}>
                    <Text style={styles.buttonTextStyle}>Find a Vehicle by Hints</Text>
                </TouchableOpacity>

                <View style={styles.formContainer}>
                    <Text style={styles.subtitle}>Owner information :</Text>
                    <TextInput
                        value={licensePlate}
                        onChangeText={setLicensePlate}
                        placeholder="License Plate"
                        style={styles.input}
                    />
                </View>
           
                <View style={styles.formContainer}>
                    <Text style={styles.subtitle}>Rental information :</Text>
                    <TextInput
                        value={pickupLocation}
                        onChangeText={setPickupLocation}
                        placeholder="Pickup Location Address"
                        style={styles.input}
                    />
                    <TextInput
                        value={rentalPrice}
                        onChangeText={setRentalPrice}
                        placeholder="Rental Price / Week"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                </View>
        
                <TouchableOpacity style={styles.buttonStyle} onPress={btnToCreatePressed}>
                    <Text style={styles.buttonTextStyle}>Create Listing</Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        padding: 14
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: 'bold',
        textAlign: 'left'
    },
    input: {
        fontSize: 20,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 8,
        padding: 8,
    },
    horizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
        width: 'auto',
        height: 'auto',
        paddingRight: 12
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 12
    },
    buttonStyle: {
        height: 50,
        marginBottom: 12,
        padding: 5,
        borderRadius: 10,
        backgroundColor:'#d6cabc',
        justifyContent:'center',
        alignItems:'center',
    },
    buttonTextStyle: {
        fontWeight: 'bold',
        color:'#000',
        fontSize: 20
    }
})

export default ListingScreen