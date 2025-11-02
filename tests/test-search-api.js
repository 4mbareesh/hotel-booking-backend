#!/usr/bin/env node

/**
 * Test script for Room Search functionality
 * Make sure your server is running and has some room types created
 */

const API_BASE = 'http://localhost:5000/api'

// Sample room types (ensure these exist before testing search)
const sampleRoomTypes = [
  {
    name: "Deluxe Room",
    description: "Luxurious room with city view, king-size bed, and modern amenities",
    maxOccupancy: 2,
    pricePerNight: 3000,
    totalQuantity: 10
  },
  {
    name: "Family Suite",
    description: "Spacious suite with two bedrooms, perfect for families",
    maxOccupancy: 4,
    pricePerNight: 6000,
    totalQuantity: 5
  }
]

async function testSearchAPI() {
  console.log('🔍 Testing Room Search API...\n')

  try {
    // 1. First, ensure we have some room types
    console.log('1. Setting up test data...')
    let roomTypeIds = []
    
    for (const roomType of sampleRoomTypes) {
      try {
        const response = await fetch(`${API_BASE}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomType)
        })
        
        if (response.ok) {
          const result = await response.json()
          roomTypeIds.push(result.data._id)
          console.log(`   ✓ Created/Found "${roomType.name}"`)
        } else {
          // Room type might already exist, let's get all and find it
          const getAllResponse = await fetch(`${API_BASE}/rooms`)
          const getAllResult = await getAllResponse.json()
          const existing = getAllResult.data?.find(rt => rt.name === roomType.name)
          if (existing) {
            roomTypeIds.push(existing._id)
            console.log(`   ✓ Found existing "${roomType.name}"`)
          }
        }
      } catch (error) {
        console.log(`   ⚠ Error with "${roomType.name}": ${error.message}`)
      }
    }

    // 2. Test search with valid parameters
    console.log('\n2. Testing valid search...')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(today.getDate() + 3)
    
    const checkIn = tomorrow.toISOString().split('T')[0]
    const checkOut = dayAfter.toISOString().split('T')[0]
    const guests = 2

    const searchResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
    const searchResult = await searchResponse.json()
    
    console.log(`   Status: ${searchResponse.status} ${searchResponse.statusText}`)
    console.log(`   Found: ${searchResult.count || 0} available room types`)
    
    if (searchResult.success && searchResult.data) {
      searchResult.data.forEach(room => {
        console.log(`   - ${room.name}: ${room.availableCount}/${room.totalQuantity} available, ₹${room.pricePerNight}/night (Total: ₹${room.totalPrice})`)
      })
    }

    // 3. Test search with missing parameters
    console.log('\n3. Testing invalid search (missing parameters)...')
    const invalidResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}`)
    const invalidResult = await invalidResponse.json()
    
    console.log(`   Status: ${invalidResponse.status} ${invalidResponse.statusText}`)
    console.log(`   Message: ${invalidResult.message}`)

    // 4. Test search with invalid dates
    console.log('\n4. Testing invalid dates...')
    const pastDateResponse = await fetch(`${API_BASE}/search?checkIn=2020-01-01&checkOut=2020-01-03&guests=2`)
    const pastDateResult = await pastDateResponse.json()
    
    console.log(`   Status: ${pastDateResponse.status} ${pastDateResponse.statusText}`)
    console.log(`   Message: ${pastDateResult.message}`)

    // 5. Test search with too many guests
    console.log('\n5. Testing search with high guest count...')
    const highGuestsResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=10`)
    const highGuestsResult = await highGuestsResponse.json()
    
    console.log(`   Status: ${highGuestsResponse.status} ${highGuestsResponse.statusText}`)
    console.log(`   Found: ${highGuestsResult.count || 0} available room types`)

    // 6. Test specific room type availability
    if (roomTypeIds.length > 0) {
      console.log('\n6. Testing specific room type availability...')
      const roomId = roomTypeIds[0]
      const roomAvailResponse = await fetch(`${API_BASE}/search/room/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}`)
      const roomAvailResult = await roomAvailResponse.json()
      
      console.log(`   Status: ${roomAvailResponse.status} ${roomAvailResponse.statusText}`)
      
      if (roomAvailResult.success && roomAvailResult.data) {
        const { roomType, availability } = roomAvailResult.data
        console.log(`   Room: ${roomType.name}`)
        console.log(`   Available: ${availability.availableCount}/${availability.totalQuantity} (${availability.bookedCount} booked)`)
      }
    }

    // 7. Test date range logic
    console.log('\n7. Testing various date ranges...')
    const futureDate1 = new Date(today)
    futureDate1.setDate(today.getDate() + 10)
    const futureDate2 = new Date(today)
    futureDate2.setDate(today.getDate() + 11)
    const futureDate3 = new Date(today)
    futureDate3.setDate(today.getDate() + 15)
    const futureDate4 = new Date(today)
    futureDate4.setDate(today.getDate() + 20)
    const futureDate5 = new Date(today)
    futureDate5.setDate(today.getDate() + 30)
    const futureDate6 = new Date(today)
    futureDate6.setDate(today.getDate() + 32)
    
    const testCases = [
      { checkIn: futureDate1.toISOString().split('T')[0], checkOut: futureDate2.toISOString().split('T')[0], guests: 1, desc: 'Single night' },
      { checkIn: futureDate3.toISOString().split('T')[0], checkOut: futureDate4.toISOString().split('T')[0], guests: 2, desc: 'Multiple nights' },
      { checkIn: futureDate5.toISOString().split('T')[0], checkOut: futureDate6.toISOString().split('T')[0], guests: 4, desc: 'Future period' }
    ]

    for (const testCase of testCases) {
      const response = await fetch(`${API_BASE}/search?checkIn=${testCase.checkIn}&checkOut=${testCase.checkOut}&guests=${testCase.guests}`)
      const result = await response.json()
      
      console.log(`   ${testCase.desc}: ${result.count || 0} rooms available`)
    }

    console.log('\n✅ Search API testing completed!')

  } catch (error) {
    console.error('\n❌ Search API testing failed:', error.message)
    console.log('\nMake sure:')
    console.log('1. Your server is running on http://localhost:5000')
    console.log('2. MongoDB is connected and running')
    console.log('3. You have some room types created')
  }
}

// Run the test
testSearchAPI()