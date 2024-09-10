// Helper function to check if a date is a weekend
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };
  
  // Helper function to check if a date is a holiday
  const isHoliday = (date, holidays) => {
    const formattedDate = date.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
    return holidays.includes(formattedDate);
  };
  
  // Function to calculate working days between two dates, excluding weekends and holidays
  const calculateWorkingDays = (startDate, endDate, holidays = []) => {
    let currentDate = new Date(startDate);
    let workingDays = 0;
  
    // Loop through each day between the start and end date
    while (currentDate <= endDate) {
      if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
        workingDays++;
      }
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return workingDays;
  };
  
  module.exports = {
    calculateWorkingDays,
  };
  