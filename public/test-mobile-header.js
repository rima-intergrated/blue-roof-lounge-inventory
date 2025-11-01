// Test file to verify hamburger menu functionality
// This file can be used to test the mobile header functionality

console.log('Testing BlueRoof Header Mobile Functionality...');

// Function to test if hamburger menu functionality is working
function testHamburgerMenu() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const navList = document.querySelector('.blue-roof-nav-list');
  
  if (!hamburgerBtn || !navList) {
    console.error('Hamburger button or navigation list not found!');
    return false;
  }
  
  console.log('✅ Hamburger button and navigation list found');
  
  // Check if classes are properly toggled
  const initialHamburgerClasses = hamburgerBtn.classList.toString();
  const initialNavClasses = navList.classList.toString();
  
  console.log('Initial hamburger classes:', initialHamburgerClasses);
  console.log('Initial nav classes:', initialNavClasses);
  
  // Simulate click
  hamburgerBtn.click();
  
  setTimeout(() => {
    const afterClickHamburgerClasses = hamburgerBtn.classList.toString();
    const afterClickNavClasses = navList.classList.toString();
    
    console.log('After click hamburger classes:', afterClickHamburgerClasses);
    console.log('After click nav classes:', afterClickNavClasses);
    
    // Check if 'open' class was added to hamburger
    const hasOpenClass = hamburgerBtn.classList.contains('open');
    const hasMobileOpenClass = navList.classList.contains('mobile-open');
    
    if (hasOpenClass && hasMobileOpenClass) {
      console.log('✅ Menu opened successfully!');
      
      // Test clicking again to close
      hamburgerBtn.click();
      
      setTimeout(() => {
        const isMenuClosed = !hamburgerBtn.classList.contains('open') && 
                            !navList.classList.contains('mobile-open');
        
        if (isMenuClosed) {
          console.log('✅ Menu closed successfully!');
          console.log('🎉 All hamburger menu tests passed!');
        } else {
          console.error('❌ Menu failed to close');
        }
      }, 100);
      
    } else {
      console.error('❌ Menu failed to open');
      console.error('Missing classes - Open:', hasOpenClass, 'Mobile-open:', hasMobileOpenClass);
    }
  }, 100);
}

// Test click outside functionality
function testClickOutside() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const navList = document.querySelector('.blue-roof-nav-list');
  
  if (!hamburgerBtn || !navList) {
    console.error('Elements not found for click outside test');
    return;
  }
  
  // Open menu first
  hamburgerBtn.click();
  
  setTimeout(() => {
    // Click outside (on body)
    document.body.click();
    
    setTimeout(() => {
      const isMenuClosed = !hamburgerBtn.classList.contains('open') && 
                          !navList.classList.contains('mobile-open');
      
      if (isMenuClosed) {
        console.log('✅ Click outside functionality working!');
      } else {
        console.log('⚠️  Click outside may not be working (check if menu ref contains clicked element)');
      }
    }, 100);
  }, 100);
}

// Run tests when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      testHamburgerMenu();
      setTimeout(testClickOutside, 1000);
    }, 500);
  });
} else {
  setTimeout(() => {
    testHamburgerMenu();
    setTimeout(testClickOutside, 1000);
  }, 500);
}

// Instructions for manual testing
console.log(`
🧪 MANUAL TESTING INSTRUCTIONS:

1. Resize your browser window to mobile size (< 800px width)
2. You should see the hamburger menu button (☰) appear
3. Click the hamburger button - menu should slide down
4. Click it again - menu should slide up
5. Open menu and click outside - menu should close
6. Navigate to a different page - menu should auto-close
7. Check that logout button is visible on mobile

📱 RESPONSIVE BREAKPOINTS:
- < 800px: Hamburger menu appears
- < 480px: Compact navigation buttons
- < 360px: Extra compact layout
- Landscape: Scrollable menu for small heights

✨ ENHANCED MOBILE FEATURES:
- Touch-friendly 48px+ button heights
- Smooth slide-in animations with icons
- Visual feedback with hover/active states
- Ripple effects on button taps
- Backdrop blur effects
- Accessibility focus indicators
- Momentum scrolling on iOS
- Auto-hiding scrollbars
- Connection status hidden on mobile
`);