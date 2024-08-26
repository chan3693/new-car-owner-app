import { View, Text, StyleSheet, Pressable, Alert, Image, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

const BookingScreen = ({route}) => {

    // get current user id
    const { userId } = route.params

    const [bookingList, setBookingList] = useState([])

    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect( () =>{
        getBookingFromRenterDB()
    }, [])

    const getBookingFromRenterDB = async () => {
        try{
            // get all the renter id
            const renterCollectionRef = collection(db, 'Renter DB')
            const renterQuerySnapshot = await getDocs(renterCollectionRef)
            const renterList = []

            renterQuerySnapshot.forEach( (eachRenter) => {
                const renters = {
                    id: eachRenter.id,
                    ...eachRenter.data()
                }
                renterList.push(renters)
            })
            console.log(`Number of renter : ${renterList.length}`)

            // get all bookings from all renter
            const bookingFromDB = []

            for ( const renter of renterList) {
                const { id: renterId, renterName, renterPhoto } = renter

                const bookingCollectionRef = collection(db, 'Renter DB', renterId, 'Booking')
                const bookingQuerySnapshot = await getDocs(bookingCollectionRef)
                console.log(`renter : ${renterId}`)

                bookingQuerySnapshot.forEach( (eachDoc) => {
                    // console.log(`eachDoc : ${JSON.stringify(eachDoc)}`)
                    const booking = {
                        id: eachDoc.id,
                        ...eachDoc.data(),
                        renterId: renterId,
                        renterName: renterName,
                        renterPhoto: renterPhoto,
                    }
                    // console.log(`booking : ${JSON.stringify(booking)}`)
                    //check the ownerId in renter db if equal to current user id
                    if(booking.ownerId === userId){
                        bookingFromDB.push(booking)
                    }
                })
            }

            console.log(`results from db ${JSON.stringify(bookingFromDB)}`)
            console.log(`Total number of bookings : ${bookingFromDB.length}`)
            setBookingList(bookingFromDB)
        }catch(err){
            console.log(`Error while retrieving booking : ${err}`)
        }finally{
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const btnToApprove = (renterId, bookingId, carId) => {
        Alert.alert(
            "Confirm Approval", 
            "Are you sure to approve this booking?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Ok",
                    onPress: async () => {
                        try{
                            const renterDocRef = doc(db, 'Renter DB', renterId, 'Booking', bookingId)                          
                            const ownerDocRef = doc(db, 'Car Owner DB', userId, 'Listing', carId)

                            const ownerDocSnapshot = await getDoc(ownerDocRef)
                            const ownerData = ownerDocSnapshot.data()

                            
                            if (ownerData.carStatus === "Pending"){
                                const confirmationCode = Math.random().toString(36).substring(2, 12).toUpperCase()
                                console.log(`code : ${confirmationCode}`);

                                await updateDoc(renterDocRef, {bookingStatus: "Confirmed", confirmationCode, carStatus: "Unavailable"})
                                await updateDoc(ownerDocRef, {carStatus: "Unavailable", confirmationCode})

                                Alert.alert("Success", "Booking Approved")
                                getBookingFromRenterDB()
                            }else if (ownerData.carStatus === "Unavailable") {
                                Alert.alert("Cannot approve again", "This car already approved to other booking. Please decline this booking.")
                                console.log(`Duplicate approval, licensePlate: ${ownerData.licensePlate}`)
                            }
                        }catch(err){
                            console.log(`Error while approving booking : ${err}`)
                        }
                    }
                }
            ],
            { cancelable: false}
        )
    }

    const btnToDecline = (renterId, bookingId, carId) => {
        Alert.alert(
            "Confirm Decline", 
            "Are you sure to decline this booking?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Ok",
                    onPress: async () => {
                        try{
                            const renterDocRef = doc(db, 'Renter DB', renterId, 'Booking', bookingId)
                            const ownerDocRef = doc(db, 'Car Owner DB', userId, 'Listing', carId)

                            const ownerDocSnapshot = await getDoc(ownerDocRef)
                            const ownerData = ownerDocSnapshot.data()

                            if (ownerData.carStatus === "Unavailable"){
                                await updateDoc(renterDocRef, {bookingStatus: "Declined", carStatus: "Unavailable"})
                            } else if (ownerData.carStatus === "Pending"){
                                await updateDoc(renterDocRef, {bookingStatus: "Declined", carStatus: "Available"})
                                await updateDoc(ownerDocRef, {carStatus: "Available"})
                
                                Alert.alert("Success", "Booking Declined")
                            }
                            getBookingFromRenterDB()
                        }catch(err){
                            console.log(`Error while declining booking : ${err}`)
                        }
                    }
                }
            ],
            { cancelable: false}
        )
    }

    const onRefresh = () =>{
        setIsRefreshing(true)
        getBookingFromRenterDB()
    }

    const renderDataItem = ({item}) => {

        const status = item.bookingStatus === "Pending" ? "Needs Approval" : 
                        item.bookingStatus === "Confirmed" ? "Approved" :
                        item.bookingStatus === "Declined" ? "Declined" : null

        return (
            <View style={styles.itemContainer}>   
                <Text style={styles.text2}>Vehicle : {item.vehicleMake} {item.vehicleModel}</Text>
                <Text style={styles.text}>License Plate : {item.licensePlate}</Text>
                <Text style={styles.text}>Price : ${item.rentalPrice} / Week</Text>
                {/* Renter Name and Photo in renter DB */}
                <Text style={styles.text2}>Renter Info :</Text>
                <View style={styles.horizontalPhoto}>
                    <Image style={styles.image} source={{uri: item.renterPhoto}}/>
                    <View style={styles.container1}>
                        <Text style={styles.text}>{item.renterName}</Text>  
                        {/* Booking date (note: this value will be randomly generated by the Renter app) */}     
                    <Text style={styles.textDate}>Booking Date :</Text>  
                    <Text style={styles.text}>{item.bookingDate}</Text>
                    </View>
                </View>    
                
                {/* Booking status in renter DB */}
                <Text style={styles.text2}>Booking Status : {status}</Text>
                {
                    item.bookingStatus === "Pending" ? (      
                        <View style={styles.horizontal}>
                            <Pressable style={styles.buttonStyle1} onPress={() => btnToApprove(item.renterId, item.id, item.carId)}>
                                <Text style={styles.buttonTextStyle}>Approve</Text>
                            </Pressable>
                            <Pressable style={styles.buttonStyle2} onPress={() => btnToDecline(item.renterId, item.id, item.carId)}>
                                <Text style={styles.buttonTextStyle}>Decline</Text>
                            </Pressable>
                                {/* Booking confirmation code → this should only appear if the booking stautus is approved. */}
                        </View> 
                    ) : item.bookingStatus === "Confirmed" ? ( 
                        <>
                            <Text style={styles.text2}>Booking confirmation code :</Text> 
                            <Text style={styles.textImp}>{item.confirmationCode}</Text>
                        </>
                    ) : null
                }
            </View>
        )
    }


    return(
        bookingList.length === 0 ? 
        <ScrollView
            style={styles.ScrollContainer}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    />
            }
        >
            <Text style={styles.msgTitle}>No bookings found</Text>
        </ScrollView> :
        <View style={styles.container}>
            {
                isLoading ? (<ActivityIndicator size="large"/>) : 
                (
                    <FlatList
                        data={bookingList}
                        keyExtractor={(item) => {return item.id}}
                        renderItem={renderDataItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                />
                        }
                    />
                )
            }       
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff6f6',
        justifyContent: 'center',
    },
    ScrollContainer:{
        flex: 1,
        backgroundColor: '#fff6f6',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text:{
        fontSize: 18,
        marginBottom: 8,
        color: '#3a3b3c'
    },
    text2:{
        fontSize: 18,
        fontWeight:'bold',
        marginBottom: 8
    },
    textDate:{
        fontSize: 18,
        color: '#3a3b3c'
    },
    textImp:{
        fontSize: 18,
        fontWeight:'bold',
        color: 'red'
    },
    image: {
        width: 80,
        height: 80,
        // marginBottom: 12,
        borderColor: 'black',
        borderWidth: 0,
        borderRadius: 10,
        marginRight: 18
      },
    itemContainer: {
        borderRadius: 10,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
        marginVertical: 14,
        marginHorizontal: 14,
        backgroundColor: '#fff',
    },
    buttonStyle1: {
        height: 50,
        width: '50%',
        marginHorizontal: 8,
        marginTop: 12,
        padding: 5,
        borderRadius: 10,
        backgroundColor:'#1fd655',
        justifyContent:'center',
        alignItems:'center',
    },
    buttonStyle2:{
        height: 50,
        width: '50%',
        marginHorizontal: 8,
        marginTop: 12,
        padding: 5,
        borderRadius: 10,
        backgroundColor:'red',
        justifyContent:'center',
        alignItems:'center',
    },
    buttonTextStyle: {
        fontWeight: 'bold',
        color:'#000',
        fontSize: 20
    },
    horizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
        width: '90%',
        height: 'auto',
    },
    horizontalPhoto: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent:'space-between',
        width: '100%',
        height: 'auto',
        marginBottom: 8,
    },
    msgTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 10,
        color: 'red',
        textAlign: 'center'
      },
})

export default BookingScreen