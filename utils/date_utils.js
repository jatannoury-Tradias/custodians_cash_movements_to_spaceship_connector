function get_curr_day_to_curr_plus_one_midnight_date(from_date=null) {
  let current_date =
    from_date === null
      ? new Date().getDate() - 1
      : new Date(from_date).getDate();
  // uncomment the below to set specific date in current month
  // current_date = 13;
  let start_date_timestamp = new Date(
    new Date(new Date().setDate(current_date)).setHours(0, 0, 0, 0)
  ).getTime();
  let end_time_timestamp = new Date(
    new Date(new Date().setDate(current_date + 1)).setHours(0, 0, 0, 0)
  ).getTime();
  return {
    start_date_timestamp,
    end_time_timestamp,
  };
}
module.exports = {
  get_curr_day_to_curr_plus_one_midnight_date,
};