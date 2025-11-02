#!/usr/bin/env node

/**
 * Test script for Booking API functionality
 * Tests the complete booking flow: search -> book -> manage
 */

const API_BASE = 'http://localhost:5000/api'

// Test data
const testCustomer = {
  name: "John Doe",
  phone: "+1234567890"
}

async function testBookingAPI() {
  console.log('📋 Testing Booking API...\n')

  try {
    let roomTypeId = null
    let bookingId = null

    // 1. First ensure we have room types available
    console.log('1. Setting up test data...')
    const roomsResponse = await fetch(`${API_BASE}/rooms`)
    const roomsResult = await roomsResponse.json()
    
    if (!roomsResult.success || roomsResult.count === 0) {
      console.log('   ⚠ No room types found. Creating a test room type...')
      const createResponse = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Test Deluxe Room",
          description: "Test room for booking API",
          maxOccupancy: 2,
          pricePerNight: 3000,
          totalQuantity: 5
        })
      })
      
      if (createResponse.ok) {
        const createResult = await createResponse.json()
        roomTypeId = createResult.data._id
        console.log('   ✓ Created test room type')
      }
    } else {
      roomTypeId = roomsResult.data[0]._id
      console.log('   ✓ Found existing room type')
    }

    if (!roomTypeId) {
      throw new Error('Could not get a room type ID for testing')
    }

    // 2. Search for available rooms
    console.log('\n2. Searching for available rooms...')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(today.getDate() + 3)
    
    const checkIn = tomorrow.toISOString().split('T')[0]
    const checkOut = dayAfter.toISOString().split('T')[0]

    const searchResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`)
    const searchResult = await searchResponse.json()
    
    console.log(`   Status: ${searchResponse.status}`)
    console.log(`   Available rooms: ${searchResult.count || 0}`)

    // 3. Test booking creation
    console.log('\n3. Testing booking creation...')
    const bookingData = {
      roomTypeId: roomTypeId,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 2
    }

    const bookResponse = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })

    const bookResult = await bookResponse.json()
    console.log(`   Status: ${bookResponse.status} ${bookResponse.statusText}`)
    
    if (bookResponse.ok) {
      bookingId = bookResult.data.booking._id
      const summary = bookResult.data.summary
      console.log(`   ✓ Booking created successfully!`)
      console.log(`   📋 Booking ID: ${summary.bookingId}`)
      console.log(`   🏨 Room: ${summary.roomType}`)
      console.log(`   📅 Dates: ${summary.checkIn} to ${summary.checkOut} (${summary.nights} nights)`)
      console.log(`   💰 Total: ₹${summary.totalPrice} (₹${summary.pricePerNight}/night)`)
    } else {
      console.log(`   ❌ Booking failed: ${bookResult.message}`)
    }

    // 4. Test booking retrieval
    if (bookingId) {
      console.log('\n4. Testing booking retrieval...')
      
      // Get booking by ID
      const getBookingResponse = await fetch(`${API_BASE}/bookings/${bookingId}`)
      const getBookingResult = await getBookingResponse.json()
      
      console.log(`   Get by ID: ${getBookingResponse.status} ${getBookingResponse.statusText}`)
      if (getBookingResult.success) {
        console.log(`   ✓ Retrieved booking for ${getBookingResult.data.customerName}`)
      }

      // Get bookings by phone
      const getByPhoneResponse = await fetch(`${API_BASE}/bookings/customer/${encodeURIComponent(testCustomer.phone)}`)
      const getByPhoneResult = await getByPhoneResponse.json()
      
      console.log(`   Get by phone: ${getByPhoneResponse.status} ${getByPhoneResponse.statusText}`)
      console.log(`   Found ${getByPhoneResult.count || 0} bookings for ${testCustomer.phone}`)
    }

    // 5. Test booking management (Admin endpoints)
    console.log('\n5. Testing admin booking management...')
    
    // Get all bookings
    const getAllResponse = await fetch(`${API_BASE}/bookings`)
    const getAllResult = await getAllResponse.json()
    
    console.log(`   Get all bookings: ${getAllResponse.status}`)
    console.log(`   Total bookings: ${getAllResult.total || 0}`)

    // Get with filters
    const getConfirmedResponse = await fetch(`${API_BASE}/bookings?status=confirmed&limit=5`)
    const getConfirmedResult = await getConfirmedResponse.json()
    
    console.log(`   Confirmed bookings: ${getConfirmedResult.count || 0}`)

    // 6. Test booking updates
    if (bookingId) {
      console.log('\n6. Testing booking updates...')
      
      // Update guest count
      const updateResponse = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfGuests: 1,
          customerName: "John Updated Doe"
        })
      })

      const updateResult = await updateResponse.json()
      console.log(`   Update booking: ${updateResponse.status} ${updateResponse.statusText}`)
      
      if (updateResult.success) {
        console.log(`   ✓ Updated guests: ${updateResult.data.numberOfGuests}`)
        console.log(`   ✓ Updated name: ${updateResult.data.customerName}`)
      }
    }

    // 7. Test booking cancellation
    if (bookingId) {
      console.log('\n7. Testing booking cancellation...')
      
      const cancelResponse = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
        method: 'PUT'
      })

      const cancelResult = await cancelResponse.json()
      console.log(`   Cancel booking: ${cancelResponse.status} ${cancelResponse.statusText}`)
      
      if (cancelResult.success) {
        console.log(`   ✓ Booking cancelled successfully`)
        console.log(`   📋 Status: ${cancelResult.data.status}`)
      }
    }

    // 8. Test validation errors
    console.log('\n8. Testing validation errors...')
    
    // Test missing fields
    const invalidBookResponse = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Test User"
        // Missing required fields
      })
    })

    const invalidBookResult = await invalidBookResponse.json()
    console.log(`   Missing fields: ${invalidBookResponse.status} - ${invalidBookResult.message}`)

    // Test past dates
    const pastBookResponse = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Test User",
        customerPhone: "+1234567890",
        checkInDate: "2020-01-01",
        checkOutDate: "2020-01-02",
        numberOfGuests: 1
      })
    })

    const pastBookResult = await pastBookResponse.json()
    console.log(`   Past dates: ${pastBookResponse.status} - ${pastBookResult.message}`)

    // Test exceeding capacity
    const capacityBookResponse = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Test User",
        customerPhone: "+1234567890",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 10 // Too many guests
      })
    })

    const capacityBookResult = await capacityBookResponse.json()
    console.log(`   Too many guests: ${capacityBookResponse.status} - ${capacityBookResult.message}`)

    // 9. Test availability after booking
    console.log('\n9. Testing availability after booking...')
    const searchAfterResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`)
    const searchAfterResult = await searchAfterResponse.json()
    
    console.log(`   Available rooms after booking: ${searchAfterResult.count || 0}`)
    if (searchAfterResult.data && searchAfterResult.data.length > 0) {
      const room = searchAfterResult.data.find(r => r._id === roomTypeId)
      if (room) {
        console.log(`   Room availability updated: ${room.availableCount}/${room.totalQuantity}`)
      }
    }

    console.log('\n✅ Booking API testing completed!')

  } catch (error) {
    console.error('\n❌ Booking API testing failed:', error.message)
    console.log('\nMake sure:')
    console.log('1. Your server is running on http://localhost:5000')
    console.log('2. MongoDB is connected')
    console.log('3. You have room types created')
  }
}

// Run the test
testBookingAPI()