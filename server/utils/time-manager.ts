import { type } from "os";

class TimeManagerClass {
  // Get current time in EST
  getCurrentEST() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  // Get midnight for a given date in EST
  getESTMidnight(date: Date | string) {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const est = new Date(targetDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    est.setHours(0, 0, 0, 0);
    return est;
  }

  // Check if current time has passed midnight since last access
  hasPassedMidnight(lastAccessDate: Date | string) {
    const lastAccess = typeof lastAccessDate === 'string' ? new Date(lastAccessDate) : lastAccessDate;
    const currentMidnight = this.getESTMidnight(this.getCurrentEST());
    const lastAccessMidnight = this.getESTMidnight(lastAccess);
    return currentMidnight.getTime() > lastAccessMidnight.getTime();
  }

  // Calculate user's current day number based on their first access date
  getDayNumber(firstAccessDate: Date | string, currentDate?: Date) {
    const startDate = typeof firstAccessDate === 'string' ? new Date(firstAccessDate) : firstAccessDate;
    const endDate = currentDate || this.getCurrentEST();
    
    // Ensure both dates are set to midnight EST for accurate day calculation
    const firstMidnight = this.getESTMidnight(startDate);
    const currentMidnight = this.getESTMidnight(endDate);
    
    // Calculate full days between the two dates
    const dayDiff = Math.floor((currentMidnight.getTime() - firstMidnight.getTime()) / (1000 * 60 * 60 * 24));
    
    // Day counting starts at 1
    return Math.max(1, dayDiff + 1);
  }

  // Get next midnight in EST
  getNextMidnight(date: Date | string) {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const nextDay = new Date(this.getESTMidnight(targetDate));
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }
}

export const TimeManager = new TimeManagerClass();
