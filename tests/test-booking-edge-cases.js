#!/usr/bin/env node

/**
 * Advanced test script for Booking API edge cases and race conditions
 * Tests concurrent bookings, duplicate prevention, and availability tracking
 */

const API_BASE = 'http://localhost:5000/api'

// Test data
const testCustomers = [
  { name: "Alice Johnson", phone: "+1111111111" },
  { name: "Bob Smith", phone: "+2222222222" },
  { name: "Charlie Brown", phone: "+3333333333" }
]

async function testAdvancedBookingScenarios() {
  console.log('🧪 Testing Advanced Booking Edge Cases...\n')

  try {
    let roomTypeId = null

    // 1. Setup - Get a room type
    console.log('1. Setting up test data...')
    const roomsResponse = await fetch(`${API_BASE}/rooms`)
    const roomsResult = await roomsResponse.json()
    
    if (roomsResult.success && roomsResult.count > 0) {
      roomTypeId = roomsResult.data[0]._id
      console.log(`   ✓ Using room type: ${roomsResult.data[0].name} (${roomsResult.data[0].totalQuantity} total rooms)`)
    } else {
      throw new Error('No room types available for testing')
    }

    // Calculate dates
    const today = new Date()
    const checkInDate = new Date(today)
    checkInDate.setDate(today.getDate() + 1)
    const checkOutDate = new Date(today)
    checkOutDate.setDate(today.getDate() + 3)
    
    const checkIn = checkInDate.toISOString().split('T')[0]
    const checkOut = checkOutDate.toISOString().split('T')[0]

    // 2. Test concurrent booking attempts (race condition simulation)
    console.log('\n2. Testing concurrent booking attempts...')
    
    const concurrentBookings = testCustomers.map((customer, index) => {
      return fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: roomTypeId,
          customerName: customer.name,
          customerPhone: customer.phone,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: 1
        })
      })
    })

    const concurrentResults = await Promise.all(concurrentBookings)
    
    let successfulBookings = 0
    let failedBookings = 0
    const bookingIds = []

    for (let i = 0; i < concurrentResults.length; i++) {
      const response = concurrentResults[i]
      const result = await response.json()
      
      if (response.ok) {
        successfulBookings++
        bookingIds.push(result.data.booking._id)
        console.log(`   ✓ ${testCustomers[i].name}: Booking successful (${result.data.summary.bookingId})`)
      } else {
        failedBookings++
        console.log(`   ❌ ${testCustomers[i].name}: ${result.message}`)
      }
    }

    console.log(`   📊 Results: ${successfulBookings} successful, ${failedBookings} failed`)

    // 3. Test duplicate booking prevention
    console.log('\n3. Testing duplicate booking prevention...')
    
    if (successfulBookings > 0) {
      const duplicateAttempt = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: roomTypeId,
          customerName: testCustomers[0].name,
          customerPhone: testCustomers[0].phone,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: 1
        })
      })

      const duplicateResult = await duplicateAttempt.json()
      console.log(`   Status: ${duplicateAttempt.status}`)
      console.log(`   Message: ${duplicateResult.message}`)
      
      if (duplicateResult.existingBooking) {
        console.log(`   Existing booking: ${duplicateResult.existingBooking.bookingId}`)
      }
    }

    // 4. Test availability tracking
    console.log('\n4. Testing availability tracking...')
    
    const searchResponse = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`)
    const searchResult = await searchResponse.json()
    
    if (searchResult.success && searchResult.data) {
      const targetRoom = searchResult.data.find(room => room._id === roomTypeId)
      if (targetRoom) {
        console.log(`   Room availability: ${targetRoom.availableCount}/${targetRoom.totalQuantity}`)
        console.log(`   Expected reduction: ${successfulBookings} bookings should reduce availability`)
      }
    }

    // 5. Test booking with insufficient availability
    console.log('\n5. Testing booking with no availability...')
    
    // Try to book all remaining rooms plus one more
    if (searchResult.data) {
      const targetRoom = searchResult.data.find(room => room._id === roomTypeId)
      if (targetRoom && targetRoom.availableCount > 0) {
        console.log(`   Attempting to book ${targetRoom.availableCount + 1} rooms (more than available)...`)
        
        const overBookAttempts = []
        for (let i = 0; i < targetRoom.availableCount + 1; i++) {
          overBookAttempts.push(
            fetch(`${API_BASE}/book`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomTypeId: roomTypeId,
                customerName: `Test Customer ${i}`,
                customerPhone: `+555000${i.toString().padStart(4, '0')}`,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 1
              })
            })
          )
        }

        const overBookResults = await Promise.all(overBookAttempts)
        let additionalSuccess = 0
        let additionalFailed = 0

        for (const response of overBookResults) {
          const result = await response.json()
          if (response.ok) {
            additionalSuccess++
            bookingIds.push(result.data.booking._id)
          } else {
            additionalFailed++
          }
        }

        console.log(`   📊 Overbooking test: ${additionalSuccess} successful, ${additionalFailed} failed`)
      }
    }

    // 6. Test booking cancellation and availability restoration
    console.log('\n6. Testing booking cancellation...')
    
    if (bookingIds.length > 0) {
      const bookingToCancel = bookingIds[0]
      
      // Check availability before cancellation
      const beforeCancelSearch = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`)
      const beforeCancelResult = await beforeCancelSearch.json()
      const beforeAvailable = beforeCancelResult.data?.find(room => room._id === roomTypeId)?.availableCount || 0
      
      // Cancel the booking
      const cancelResponse = await fetch(`${API_BASE}/bookings/${bookingToCancel}/cancel`, {
        method: 'PUT'
      })
      
      const cancelResult = await cancelResponse.json()
      console.log(`   Cancel status: ${cancelResponse.status}`)
      
      if (cancelResult.success) {
        console.log(`   ✓ Booking cancelled: ${cancelResult.data.status}`)
        
        // Check availability after cancellation
        const afterCancelSearch = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`)
        const afterCancelResult = await afterCancelSearch.json()
        const afterAvailable = afterCancelResult.data?.find(room => room._id === roomTypeId)?.availableCount || 0
        
        console.log(`   Availability before cancel: ${beforeAvailable}`)
        console.log(`   Availability after cancel: ${afterAvailable}`)
        console.log(`   Expected increase: +1 room should be available`)
      }
    }

    // 7. Test edge case validations
    console.log('\n7. Testing edge case validations...')
    
    // Test with past dates
    const pastBooking = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Past Date Test",
        customerPhone: "+9999999999",
        checkInDate: "2020-01-01",
        checkOutDate: "2020-01-02",
        numberOfGuests: 1
      })
    })
    
    const pastResult = await pastBooking.json()
    console.log(`   Past date booking: ${pastBooking.status} - ${pastResult.message}`)

    // Test with invalid guest count
    const invalidGuestBooking = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Invalid Guest Test",
        customerPhone: "+8888888888",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 0
      })
    })
    
    const invalidGuestResult = await invalidGuestBooking.json()
    console.log(`   Invalid guest count: ${invalidGuestBooking.status} - ${invalidGuestResult.message}`)

    // Test with checkout before checkin
    const invalidDateBooking = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomTypeId: roomTypeId,
        customerName: "Invalid Date Test",
        customerPhone: "+7777777777",
        checkInDate: checkOut,
        checkOutDate: checkIn, // Swapped dates
        numberOfGuests: 1
      })
    })
    
    const invalidDateResult = await invalidDateBooking.json()
    console.log(`   Invalid date order: ${invalidDateBooking.status} - ${invalidDateResult.message}`)

    // 8. Final availability check
    console.log('\n8. Final availability verification...')
    
    const finalSearch = await fetch(`${API_BASE}/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`)
    const finalResult = await finalSearch.json()
    
    if (finalResult.success && finalResult.data) {
      const finalRoom = finalResult.data.find(room => room._id === roomTypeId)
      if (finalRoom) {
        console.log(`   Final availability: ${finalRoom.availableCount}/${finalRoom.totalQuantity}`)
        console.log(`   Rooms booked: ${finalRoom.totalQuantity - finalRoom.availableCount}`)
      }
    }

    console.log('\n✅ Advanced booking edge case testing completed!')

  } catch (error) {
    console.error('\n❌ Advanced booking testing failed:', error.message)
  }
}

// Run the test
testAdvancedBookingScenarios()