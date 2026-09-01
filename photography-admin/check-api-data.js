/**
 * API Data Structure Checker
 * Run this in browser console after logging in to see actual API responses
 */

async function checkAPIData() {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    console.error('❌ No token found. Please login first.');
    return;
  }

  const baseURL = 'http://localhost:3000/api';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🔍 Checking API Data Structures...\n');

  try {
    // 1. Check Admin Profile
    console.log('1️⃣ ADMIN PROFILE (/admin/profile)');
    const profileRes = await fetch(`${baseURL}/admin/profile`, { headers });
    const profileData = await profileRes.json();
    console.log('Full Response:', profileData);
    console.log('Actual Data:', profileData.data);
    console.log('Properties:', Object.keys(profileData.data || {}));
    console.log('first_name:', profileData.data?.first_name);
    console.log('last_name:', profileData.data?.last_name);
    console.log('\n');

    // 2. Check Dashboard Stats
    console.log('2️⃣ DASHBOARD STATS (/admin/dashboard/stats)');
    const statsRes = await fetch(`${baseURL}/admin/dashboard/stats`, { headers });
    const statsData = await statsRes.json();
    console.log('Full Response:', statsData);
    console.log('Actual Data:', statsData.data);
    console.log('Properties:', Object.keys(statsData.data || {}));
    console.log('pendingVerifications:', statsData.data?.pendingVerifications);
    console.log('openDisputes:', statsData.data?.openDisputes);
    console.log('\n');

    // 3. Check Recent Bookings
    console.log('3️⃣ RECENT BOOKINGS (/admin/dashboard/recent-bookings)');
    const bookingsRes = await fetch(`${baseURL}/admin/dashboard/recent-bookings`, { headers });
    const bookingsData = await bookingsRes.json();
    console.log('Full Response:', bookingsData);
    console.log('First Booking:', bookingsData.data?.[0]);
    if (bookingsData.data?.[0]) {
      const booking = bookingsData.data[0];
      console.log('Booking Properties:', Object.keys(booking));
      console.log('occasion_type:', booking.occasion_type);
      console.log('total_amount:', booking.total_amount);
      console.log('Client Relation Name:', Object.keys(booking).find(k => k.includes('client')));
      console.log('Photographer Relation Name:', Object.keys(booking).find(k => k.includes('photographer')));

      const clientKey = Object.keys(booking).find(k => k.includes('client'));
      const photographerKey = Object.keys(booking).find(k => k.includes('photographer'));

      if (clientKey) {
        console.log(`Client (via ${clientKey}):`, booking[clientKey]);
        console.log('Client Properties:', Object.keys(booking[clientKey] || {}));
      }

      if (photographerKey) {
        console.log(`Photographer (via ${photographerKey}):`, booking[photographerKey]);
        console.log('Photographer Properties:', Object.keys(booking[photographerKey] || {}));
      }
    }
    console.log('\n');

    // 4. Check Revenue
    console.log('4️⃣ REVENUE DATA (/admin/dashboard/revenue)');
    const revenueRes = await fetch(`${baseURL}/admin/dashboard/revenue?timeRange=30d`, { headers });
    const revenueData = await revenueRes.json();
    console.log('Full Response:', revenueData);
    console.log('Actual Data:', revenueData.data);
    console.log('Properties:', Object.keys(revenueData.data || {}));
    console.log('byDate exists?:', 'byDate' in (revenueData.data || {}));
    console.log('byOccasion exists?:', 'byOccasion' in (revenueData.data || {}));
    console.log('\n');

    // 5. Check Top Photographers
    console.log('5️⃣ TOP PHOTOGRAPHERS (/admin/dashboard/top-photographers)');
    const topPhotosRes = await fetch(`${baseURL}/admin/dashboard/top-photographers`, { headers });
    const topPhotosData = await topPhotosRes.json();
    console.log('Full Response:', topPhotosData);
    console.log('First Photographer:', topPhotosData.data?.[0]);
    if (topPhotosData.data?.[0]) {
      console.log('Photographer Properties:', Object.keys(topPhotosData.data[0]));
    }
    console.log('\n');

    console.log('✅ Data structure check complete!');
    console.log('\n📝 Summary:');
    console.log('- Check the property names above');
    console.log('- Compare with what your hooks expect');
    console.log('- Update interfaces if names don\'t match');

  } catch (error) {
    console.error('❌ Error checking API:', error);
  }
}

// Auto-run
checkAPIData();
