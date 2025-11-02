#!/usr/bin/env node

/**
 * Simple test script to verify Room Type CRUD operations
 * Make sure your server is running and DATABASE_URI is configured
 */

const API_BASE = 'http://localhost:5000/api'

// Sample room type data
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
  },
  {
    name: "Executive Room",
    description: "Premium room with workspace and premium amenities",
    maxOccupancy: 2,
    pricePerNight: 4500,
    totalQuantity: 8
  }
]

async function testAPI() {
  console.log('🚀 Testing Room Type CRUD API...\n')

  try {
    // Test server health
    console.log('1. Testing server health...')
    const healthResponse = await fetch(`${API_BASE}`)
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`)
    
    if (!healthResponse.ok) {
      throw new Error('Server is not responding')
    }

    // Test CREATE - Add sample room types
    console.log('\n2. Testing CREATE operations...')
    const createdRoomTypes = []
    
    for (const roomType of sampleRoomTypes) {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomType)
      })
      
      const result = await response.json()
      console.log(`   Created "${roomType.name}": ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        createdRoomTypes.push(result.data)
      } else {
        console.log(`   Error: ${result.message}`)
      }
    }

    // Test READ - Get all room types
    console.log('\n3. Testing READ operations...')
    const getAllResponse = await fetch(`${API_BASE}/rooms`)
    const getAllResult = await getAllResponse.json()
    
    console.log(`   Get All: ${getAllResponse.status} ${getAllResponse.statusText}`)
    console.log(`   Found ${getAllResult.count || 0} room types`)

    if (createdRoomTypes.length > 0) {
      // Test READ - Get single room type
      const firstRoomType = createdRoomTypes[0]
      const getSingleResponse = await fetch(`${API_BASE}/rooms/${firstRoomType._id}`)
      const getSingleResult = await getSingleResponse.json()
      
      console.log(`   Get Single: ${getSingleResponse.status} ${getSingleResponse.statusText}`)
      console.log(`   Retrieved: "${getSingleResult.data?.name || 'N/A'}"`)

      // Test UPDATE
      console.log('\n4. Testing UPDATE operations...')
      const updateData = {
        description: "Updated description - Luxury room with enhanced amenities",
        pricePerNight: 3500
      }
      
      const updateResponse = await fetch(`${API_BASE}/rooms/${firstRoomType._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      const updateResult = await updateResponse.json()
      console.log(`   Update: ${updateResponse.status} ${updateResponse.statusText}`)
      
      if (updateResponse.ok) {
        console.log(`   Updated price: ${updateResult.data.pricePerNight}`)
      } else {
        console.log(`   Error: ${updateResult.message}`)
      }

      // Test DELETE
      console.log('\n5. Testing DELETE operations...')
      const deleteResponse = await fetch(`${API_BASE}/rooms/${firstRoomType._id}`, {
        method: 'DELETE'
      })
      
      const deleteResult = await deleteResponse.json()
      console.log(`   Delete: ${deleteResponse.status} ${deleteResponse.statusText}`)
      
      if (deleteResponse.ok) {
        console.log(`   Deleted: "${deleteResult.data.name}"`)
      } else {
        console.log(`   Error: ${deleteResult.message}`)
      }

      // Verify deletion
      const verifyResponse = await fetch(`${API_BASE}/rooms/${firstRoomType._id}`)
      console.log(`   Verify deletion: ${verifyResponse.status} ${verifyResponse.statusText}`)
    }

    // Final count
    console.log('\n6. Final verification...')
    const finalResponse = await fetch(`${API_BASE}/rooms`)
    const finalResult = await finalResponse.json()
    console.log(`   Remaining room types: ${finalResult.count || 0}`)

    console.log('\n✅ API testing completed!')

  } catch (error) {
    console.error('\n❌ API testing failed:', error.message)
    console.log('\nMake sure:')
    console.log('1. Your server is running on http://localhost:5000')
    console.log('2. MongoDB is connected and running')
    console.log('3. .env file has correct DATABASE_URI')
  }
}

// Run the test
testAPI()