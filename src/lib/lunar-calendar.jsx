import {
  TK19, TK20, TK21, TK22,
  CAN,
  CHI,
  TUAN,
  TIET_KHI,
  GIO_HD
} from './constants';

/* Create lunar date object, stores (lunar) date, month, year, leap month indicator, and Julian date number */
function LunarDate(dd, mm, yy, leap, jd) {
  this.day = dd;
  this.month = mm;
  this.year = yy;
  this.leap = leap;
  this.jd = jd;
}

var PI = Math.PI;

/* Discard the fractional part of a number, e.g., INT(3.2) = 3 */
function INT(d) {
  return Math.floor(d);
}

function jdn(dd, mm, yy) {
  var a = INT((14 - mm) / 12);
  var y = yy+4800-a;
  var m = mm+12*a-3;
  var jd = dd + INT((153*m+2)/5) + 365*y + INT(y/4) - INT(y/100) + INT(y/400) - 32045;
  return jd;
  //return 367*yy - INT(7*(yy+INT((mm+9)/12))/4) - INT(3*(INT((yy+(mm-9)/7)/100)+1)/4) + INT(275*mm/9)+dd+1721029;
}

function jdn2date(jd) {
  var Z, A, alpha, B, C, D, E, dd, mm, yyyy, F;
  Z = jd;
  if (Z < 2299161) {
    A = Z;
  } else {
    alpha = INT((Z-1867216.25)/36524.25);
    A = Z + 1 + alpha - INT(alpha/4);
  }
  B = A + 1524;
  C = INT( (B-122.1)/365.25);
  D = INT( 365.25*C );
  E = INT( (B-D)/30.6001 );
  dd = INT(B - D - INT(30.6001*E));
  if (E < 14) {
    mm = E - 1;
  } else {
    mm = E - 13;
  }
  if (mm < 3) {
    yyyy = C - 4715;
  } else {
    yyyy = C - 4716;
  }
  return new Array(dd, mm, yyyy);
}

function decodeLunarYear(yy, k) {
  var monthLengths, regularMonths, offsetOfTet, leapMonth, leapMonthLength, solarNY, currentJD, j, mm;
  var ly = new Array();
  monthLengths = new Array(29, 30);
  regularMonths = new Array(12);
  offsetOfTet = k >> 17;
  leapMonth = k & 0xf;
  leapMonthLength = monthLengths[k >> 16 & 0x1];
  solarNY = jdn(1, 1, yy);
  currentJD = solarNY+offsetOfTet;
  j = k >> 4;
  for(i = 0; i < 12; i++) {
    regularMonths[12 - i - 1] = monthLengths[j & 0x1];
    j >>= 1;
  }
  if (leapMonth == 0) {
    for(mm = 1; mm <= 12; mm++) {
      ly.push(new LunarDate(1, mm, yy, 0, currentJD));
      currentJD += regularMonths[mm-1];
    }
  } else {
    for(mm = 1; mm <= leapMonth; mm++) {
      ly.push(new LunarDate(1, mm, yy, 0, currentJD));
      currentJD += regularMonths[mm-1];
    }
    ly.push(new LunarDate(1, leapMonth, yy, 1, currentJD));
    currentJD += leapMonthLength;
    for(mm = leapMonth+1; mm <= 12; mm++) {
      ly.push(new LunarDate(1, mm, yy, 0, currentJD));
      currentJD += regularMonths[mm-1];
    }
  }
  return ly;
}

function getYearInfo(yyyy) {
  var yearCode;
  if (yyyy < 1900) {
    yearCode = TK19[yyyy - 1800];
  } else if (yyyy < 2000) {
    yearCode = TK20[yyyy - 1900];
  } else if (yyyy < 2100) {
    yearCode = TK21[yyyy - 2000];
  } else {
    yearCode = TK22[yyyy - 2100];
  }
  return decodeLunarYear(yyyy, yearCode);
}

var FIRST_DAY = jdn(25, 1, 1800); // Tet am lich 1800
var LAST_DAY = jdn(31, 12, 2199);

function findLunarDate(jd, ly) {
  if (jd > LAST_DAY || jd < FIRST_DAY || ly[0].jd > jd) {
    return new LunarDate(0, 0, 0, 0, jd);
  }
  var i = ly.length-1;
  while (jd < ly[i].jd) {
    i--;
  }
  var off = jd - ly[i].jd;
  ret = new LunarDate(ly[i].day+off, ly[i].month, ly[i].year, ly[i].leap, jd);
  return ret;
}

function getLunarDate(dd, mm, yyyy) {
  var ly, jd;
  if (yyyy < 1800 || 2199 < yyyy) {
    //return new LunarDate(0, 0, 0, 0, 0);
  }
  ly = getYearInfo(yyyy);
  jd = jdn(dd, mm, yyyy);
  if (jd < ly[0].jd) {
    ly = getYearInfo(yyyy - 1);
  }
  return findLunarDate(jd, ly);
}

/* Compute the longitude of the sun at any time.
 * Parameter: floating number jdn, the number of days since 1/1/4713 BC noon
 * Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
 */
function SunLongitude(jdn) {
  var T, T2, dr, M, L0, DL, lambda, theta, omega;
  T = (jdn - 2451545.0 ) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
  T2 = T*T;
  dr = PI/180; // degree to radian
  M = 357.52910 + 35999.05030*T - 0.0001559*T2 - 0.00000048*T*T2; // mean anomaly, degree
  L0 = 280.46645 + 36000.76983*T + 0.0003032*T2; // mean longitude, degree
  DL = (1.914600 - 0.004817*T - 0.000014*T2)*Math.sin(dr*M);
  DL = DL + (0.019993 - 0.000101*T)*Math.sin(dr*2*M) + 0.000290*Math.sin(dr*3*M);
  theta = L0 + DL; // true longitude, degree
  // obtain apparent longitude by correcting for nutation and aberration
  omega = 125.04 - 1934.136 * T;
  lambda = theta - 0.00569 - 0.00478 * Math.sin(omega * dr);
  // Convert to radians
  lambda = lambda*dr;
  lambda = lambda - PI*2*(INT(lambda/(PI*2))); // Normalize to (0, 2*PI)
  return lambda;
}

/* Compute the sun segment at start (00:00) of the day with the given integral Julian day number.
 * The time zone if the time difference between local time and UTC: 7.0 for UTC+7:00.
 * The function returns a number between 0 and 23.
 * From the day after March equinox and the 1st major term after March equinox, 0 is returned.
 * After that, return 1, 2, 3 ...
 */
function getSunLongitude(dayNumber, timeZone) {
  return INT(SunLongitude(dayNumber - 0.5 - timeZone/24.0) / PI * 12);
}

var today = new Date();
//var currentLunarYear = getYearInfo(today.getFullYear());
var currentLunarDate = getLunarDate(today.getDate(), today.getMonth()+1, today.getFullYear());
var currentMonth = today.getMonth()+1;
var currentYear = today.getFullYear();

function parseQuery(q) {
  var ret = new Array();
  if (q.length < 2) return ret;
  var s = q.substring(1, q.length);
  var arr = s.split("&");
  var i, j;
  for (i = 0; i < arr.length; i++) {
    var a = arr[i].split("=");
    for (j = 0; j < a.length; j++) {
      ret.push(a[j]);
    }
  }
  return ret;
}

function getSelectedMonth() {
  var query = window.location.search;
  var arr = parseQuery(query);
  var idx;
  for (idx = 0; idx < arr.length; idx++) {
    if (arr[idx] == "mm") {
      currentMonth = parseInt(arr[idx+1]);
    } else if (arr[idx] == "yy") {
      currentYear = parseInt(arr[idx+1]);
    }
  }
}

function getMonth(mm, yy) {
  var ly1, ly2, tet1, jd1, jd2, mm1, yy1, result, i;
  if (mm < 12) {
    mm1 = mm + 1;
    yy1 = yy;
  } else {
    mm1 = 1;
    yy1 = yy + 1;
  }
  jd1 = jdn(1, mm, yy);
  jd2 = jdn(1, mm1, yy1);
  ly1 = getYearInfo(yy);
  //alert('1/'+mm+'/'+yy+' = '+jd1+'; 1/'+mm1+'/'+yy1+' = '+jd2);
  tet1 = ly1[0].jd;
  result = new Array();
  if (tet1 <= jd1) { /* tet(yy) = tet1 < jd1 < jd2 <= 1.1.(yy+1) < tet(yy+1) */
    for (i = jd1; i < jd2; i++) {
      result.push(findLunarDate(i, ly1));
    }
  } else if (jd1 < tet1 && jd2 < tet1) { /* tet(yy-1) < jd1 < jd2 < tet1 = tet(yy) */
    ly1 = getYearInfo(yy - 1);
    for (i = jd1; i < jd2; i++) {
      result.push(findLunarDate(i, ly1));
    }
  } else if (jd1 < tet1 && tet1 <= jd2) { /* tet(yy-1) < jd1 < tet1 <= jd2 < tet(yy+1) */
    ly2 = getYearInfo(yy - 1);
    for (i = jd1; i < tet1; i++) {
      result.push(findLunarDate(i, ly2));
    }
    for (i = tet1; i < jd2; i++) {
      result.push(findLunarDate(i, ly1));
    }
  }
  return result;
}

function getDayName(lunarDate) {
  if (lunarDate.day == 0) {
    return "";
  }
  var cc = getCanChi(lunarDate);
  var s = "Ng\\u00E0y " + cc[0] +", th\\341ng "+cc[1] + ", n\\u0103m " + cc[2];
  return s;
}

function getYearCanChi(year) {
  return CAN[(year+6) % 10] + " " + CHI[(year+8) % 12];
}

/*
 * Can cua gio Chinh Ty (00:00) cua ngay voi JDN nay
 */
function getCanHour0(jdn) {
  return CAN[(jdn-1)*2 % 10];
}

function getCanChi(lunar) {
  var dayName, monthName, yearName;
  dayName = CAN[(lunar.jd + 9) % 10] + " " + CHI[(lunar.jd+1)%12];
  monthName = CAN[(lunar.year*12+lunar.month+3) % 10] + " " + CHI[(lunar.month+1)%12];
  if (lunar.leap == 1) {
    monthName += " (nhu\u1EADn)";
  }
  yearName = getYearCanChi(lunar.year);
  return new Array(dayName, monthName, yearName);
}

function getDayString(lunar, solarDay, solarMonth, solarYear) {
  var s;
  var dayOfWeek = TUAN[(lunar.jd + 1) % 7];
  s = dayOfWeek + " " + solarDay + "/" + solarMonth + "/" + solarYear;
  s += " -+- ";
  s = s + "Ng\\u00E0y " + lunar.day+" th\\341ng "+lunar.month;
  if (lunar.leap == 1) {
    s = s + " nhu\\u1EADn";
  }
  return s;
}

function getTodayString() {
  var s = getDayString(currentLunarDate, today.getDate(), today.getMonth()+1, today.getFullYear());
  s += " n\u0103m " + getYearCanChi(currentLunarDate.year);
  return s;
}

function getCurrentTime() {
  today = new Date();
  var Std = today.getHours();
  var Min = today.getMinutes();
  var Sec = today.getSeconds();
  var s1  = ((Std < 10) ? "0" + Std : Std);
  var s2  = ((Min < 10) ? "0" + Min : Min);
  //var s3  = ((Sec < 10) ? "0" + Sec : Sec);
  //return s1 + ":" + s2 + ":" + s3;
  return s1 + ":" + s2;
}

function getGioHoangDao(jd) {
  var chiOfDay = (jd+1) % 12;
  var gioHD = GIO_HD[chiOfDay % 6]; // same values for Ty' (1) and Ngo. (6), for Suu and Mui etc.
  console.log(gioHD);
  var ret = "";
  var count = 0;
  for (var i = 0; i < 12; i++) {
    if (gioHD.charAt(i) == '1') {
      ret += CHI[i];
      ret += ' ('+(i*2+23)%24+'-'+(i*2+1)%24+')';
      if (count++ < 5) ret += ', ';
      if (count == 3) ret += '\n';
    }
  }
  return ret;
}

var DAYNAMES = new Array("CN", "T2", "T3", "T4", "T5", "T6", "T7");
var PRINT_OPTS = new OutputOptions();
var FONT_SIZES = new Array("9pt", "13pt", "17pt");
var TAB_WIDTHS = new Array("180px", "420px", "600px");

function OutputOptions() {
  this.fontSize = "13pt";
  this.tableWidth = "420px";
}

function setOutputSize(size) {
  var idx = 1;
  if (size == "small") {
    idx = 0;
  } else if (size == "big") {
    idx = 2;
  } else {
    idx = 1;
  }
  PRINT_OPTS.fontSize = FONT_SIZES[idx];
  PRINT_OPTS.tableWidth = TAB_WIDTHS[idx];
}

function printSelectedMonth() {
  getSelectedMonth();
  return printMonth(currentMonth, currentYear);
}

function printMonth(mm, yy) {
  var res = "";
  res += printStyle();
  res += printTable(mm, yy);
  res += printFoot();
  return res;
}

function printYear(yy) {
  var yearName = "N&#x103;m " + getYearCanChi(yy) + " " + yy;
  var res = "";
  res += printStyle();
  res += '<table align=center>\n';
  res += ('<tr><td colspan="3" class="tennam" onClick="showYearSelect();">'+yearName+'</td></tr>\n');
  for (var i = 1; i<= 12; i++) {
    if (i % 3 == 1) res += '<tr>\n';
    res += '<td>\n';
    res += printTable(i, yy);
    res += '</td>\n';
    if (i % 3 == 0) res += '</tr>\n';
  }
  res += '<table>\n';
  res += printFoot();
  return res;
}

function printSelectedYear() {
  getSelectedMonth();
  return printYear(currentYear);
}

function printStyle() {
  var fontSize = PRINT_OPTS.fontSize;
  var res = "";
  res += '<style type="text/css">\n';
  res += '<!--\n';
  //res += '  body {margin:0}\n';
  res += '  .tennam {text-align:center; font-size:150%; line-height:120%; font-weight:bold; color:#000000; background-color: #CCCCCC}\n';
  res += '  .thang {font-size: '+fontSize+'; padding:1; line-height:100%; font-family:Tahoma,Verdana,Arial; table-layout:fixed}\n';
  res += '  .tenthang {text-align:center; font-size:125%; line-height:100%; font-weight:bold; color:#330033; background-color: #CCFFCC}\n';
  res += '  .navi-l {text-align:center; font-size:75%; line-height:100%; font-family:Verdana,Times New Roman,Arial; font-weight:bold; color:red; background-color: #CCFFCC}\n';
  res += '  .navi-r {text-align:center; font-size:75%; line-height:100%; font-family:Verdana,Arial,Times New Roman; font-weight:bold; color:#330033; background-color: #CCFFCC}\n';
  res += '  .ngaytuan {width:14%; text-align:center; font-size:125%; line-height:100%; color:#330033; background-color: #FFFFCC}\n';
  res += '  .ngaythang {background-color:#FDFDF0}\n';
  res += '  .homnay {background-color:#FFF000}\n';
  res += '  .tet {background-color:#FFCC99}\n';
  res += '  .am {text-align:right;font-size:75%;line-height:100%;color:blue}\n';
  res += '  .am2 {text-align:right;font-size:75%;line-height:100%;color:#004080}\n';
  res += '  .t2t6 {text-align:left;font-size:125%;color:black}\n';
  res += '  .t7 {text-align:left;font-size:125%;line-height:100%;color:green}\n';
  res += '  .cn {text-align:left;font-size:125%;line-height:100%;color:red}\n';
  res += '-->\n';
  res += '</style>\n';
  return res;
}

function printTable(mm, yy) {
  var i, j, k, solar, lunar, cellClass, solarClass, lunarClass;
  var currentMonth = getMonth(mm, yy);
  if (currentMonth.length == 0) return;
  var ld1 = currentMonth[0];
  var emptyCells = (ld1.jd + 1) % 7;
  var MonthHead = mm + "/" + yy;
  var LunarHead = getYearCanChi(ld1.year);
  var res = "";
  res += `<div class="lunar-calendar__month-head"> 
						<div class="lunar-calendar__month-head__date">${mm}</div>
						<div class="lunar-calendar__month-head__day-of-week">${TUAN[(currentLunarDate.jd + 1) % 7]}</div>
						<div class="lunar-calendar__month-head__description">
						  <div>Giờ đầu ngày: ${getCanHour0(currentLunarDate.jd)} ${CHI[0]}</div>
						  <div>Giờ Hoàng Đao: ${getGioHoangDao(currentLunarDate.jd)}</div>
						  <div>Tiết: ${TIET_KHI[getSunLongitude(currentLunarDate.jd+1, 7.0)]}</div>
            </div>
 					</div>`;
  res += ('<table class="lunar-calendar__month-table">\n');
  res += printHead(mm, yy);
  for (i = 0; i < 6; i++) {
    res += ("<tr>\n");
    for (j = 0; j < 7; j++) {
      k = 7 * i + j;
      if (k < emptyCells || k >= emptyCells + currentMonth.length) {
        res += printEmptyCell();
      } else {
        solar = k - emptyCells + 1;
        ld1 = currentMonth[k - emptyCells];
        res += printCell(ld1, solar, mm, yy);
      }
    }
    res += ("</tr>\n");
  }
  res += ('</table>\n');
  return res;
}

function getPrevMonthLink(mm, yy) {
  var mm1 = mm > 1 ? mm-1 : 12;
  var yy1 = mm > 1 ? yy : yy-1;
  //return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'"><img src="left1.gif" width=8 height=12 alt="PrevMonth" border=0></a>';
  return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'">&lt;</a>';
}

function getNextMonthLink(mm, yy) {
  var mm1 = mm < 12 ? mm+1 : 1;
  var yy1 = mm < 12 ? yy : yy+1;
  //return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'"><img src="right1.gif" width=8 height=12 alt="NextMonth" border=0></a>';
  return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'">&gt;</a>';
}

function getPrevYearLink(mm, yy) {
  //return '<a href="'+window.location.pathname+'?yy='+(yy-1)+'&mm='+mm+'"><img src="left2.gif" width=16 height=12 alt="PrevYear" border=0></a>';
  return '<a href="'+window.location.pathname+'?yy='+(yy-1)+'&mm='+mm+'">&lt;&lt;</a>';
}

function getNextYearLink(mm, yy) {
  //return '<a href="'+window.location.pathname+'?yy='+(yy+1)+'&mm='+mm+'"><img src="right2.gif" width=16 height=12 alt="NextYear" border=0></a>';
  return '<a href="'+window.location.pathname+'?yy='+(yy+1)+'&mm='+mm+'">&gt;&gt;</a>';
}

function printHead(mm, yy) {
  var res = "";
  var monthName = mm+"/"+yy;
  res += ('<tr><td colspan="2" class="navi-l">'+getPrevYearLink(mm, yy)+' &nbsp;'+getPrevMonthLink(mm, yy)+'</td>\n');
  res += ('<td colspan="3" class="tenthang">'+monthName+'</td>\n');
  res += ('<td colspan="2" class="navi-r">'+getNextMonthLink(mm, yy)+' &nbsp;'+getNextYearLink(mm, yy)+'</td></tr>\n');
  res += ('<tr>\n');
  for(var i=0;i<=6;i++) {
    res += ('<td class=ngaytuan>'+DAYNAMES[i]+'</td>\n');
  }
  res += ('<\/tr>\n');
  return res;
}

function printEmptyCell() {
  return '<td class=lunar-calendar__month-table__cell><div class=cn>&nbsp;</div> <div class=am>&nbsp;</div></td>\n';
}

function printCell(lunarDate, solarDate, solarMonth, solarYear) {
  var cellClass, solarClass, lunarClass, solarColor;
  cellClass = "lunar-calendar__month-table__cell";
  solarClass = "t2t6";
  lunarClass = "am lunar-calendar__month-table__cell__lunar";
  solarColor = "black";
  var dow = (lunarDate.jd + 1) % 7;
  if (dow == 0) {
    solarClass = "cn";
    solarColor = "red";
  } else if (dow == 6) {
    solarClass = "t7";
    solarColor = "green";
  }
  if (solarDate == today.getDate() && solarMonth == today.getMonth()+1 && solarYear == today.getFullYear()) {
    cellClass = "homnay lunar-calendar__month-table__cell current-date";
  }
  if (lunarDate.day == 1 && lunarDate.month == 1) {
    cellClass = "tet";
  }
  if (lunarDate.leap == 1) {
    lunarClass = "am2";
  }
  var lunar = lunarDate.day;
  if (solarDate == 1 || lunar == 1) {
    lunar = lunarDate.day + "/" + lunarDate.month;
  }
  var res = "";
  var args = lunarDate.day + "," + lunarDate.month + "," + lunarDate.year + "," + lunarDate.leap;
  args += ("," + lunarDate.jd + "," + solarDate + "," + solarMonth + "," + solarYear);
  const dateInfo = ` data-day=${lunarDate.day} data-month=${lunarDate.month} data-year=${lunarDate.year} data-leap = ${lunarDate.leap} data-jd=${lunarDate.jd} data-solar-day=${solarDate} data-solar-month=${solarMonth} data-solar-year=${solarYear} `;
  res += ('<td class="'+cellClass+'"');
  if (lunarDate != null) {
    res += (' title="'+getDayName(lunarDate)+'"' + dateInfo);
  }
  res += (' <div style=color:'+solarColor+' class="'+solarClass+'">'+solarDate+'</div> <div class="'+lunarClass+'">'+lunar+'</div></td>\n');
  return res;
}

function printFoot() {
  var res = "";
  return res;
}

function showYearSelect() {
  window.print();
}

function alertDayInfo(dd, mm, yy, leap, jd, sday, smonth, syear) {
  var lunar = new LunarDate(dd, mm, yy, leap, jd);
  var s = getDayString(lunar, sday, smonth, syear);
  s += " \u00E2m l\u1ECBch\n";
  s += getDayName(lunar);
  s += "\nGi\u1EDD \u0111\u1EA7u ng\u00E0y: "+getCanHour0(jd)+" "+CHI[0];
  s += "\nTi\u1EBFt: "+TIET_KHI[getSunLongitude(jd+1, 7.0)];
  s += "\nGi\u1EDD ho\u00E0ng \u0111\u1EA1o: "+getGioHoangDao(jd);
  alert(s);
}

export default class {
   getCalendar() {
    return printSelectedMonth();
  }
}
