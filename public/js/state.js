/* =============================================
   STATE — shared mutable variables
   Declared first so all other modules can access them.
   ============================================= */

let tasks         = [];
let user          = {};
let calWeekStart  = null;   // set to getMonday(new Date()) inside init()
let chatMinimized = false;
let chatHistory   = [];
let prevXP        = 0;
