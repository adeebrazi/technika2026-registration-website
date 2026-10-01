// Course & Stream, Semester & Category data for Technika 6.0 Registration

export const SCHOOL_CLASSES: string[] = [
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Others"
];

export const SEMESTERS_8: string[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Others"
];

export const SEMESTERS_6: string[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Others"
];

export const SEMESTERS_4: string[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Others"
];

export const SEMESTERS_LAW: string[] = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Semester 9",
  "Semester 10",
  "Others"
];

export const SEMESTERS_PHD: string[] = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Others"
];

export const ALL_SEMESTERS_DEFAULT: string[] = [
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Others"
];

// Clean, relevant Course & Branch list for Technika 6.0 participating universities and colleges
export const COURSE_OPTIONS: string[] = [
  "School Student (Class 3-12)",
  "B.Tech",
  "B.Tech - Computer Science & Engineering",
  "B.Tech - Mechanical Engineering",
  "B.Tech - Electrical & Electronics Engineering",
  "B.Tech - Electronics & Communication Engineering",
  "B.Tech - Civil Engineering",
  "BCA",
  "Diploma",
  "Diploma - Computer Science & Engineering",
  "Diploma - Mechanical Engineering",
  "Diploma - Electrical Engineering",
  "Diploma - Civil Engineering",
  "MCA",
  "M.Tech",
  "B.Sc (IT / Computer Science)",
  "B.Sc (General)",
  "M.Sc",
  "BBA",
  "MBA",
  "B.Com",
  "M.Com",
  "BA",
  "MA",
  "B.Pharm",
  "D.Pharm",
  "LLB / Law",
  "B.Des / Fashion / Interior",
  "Ph.D / Research Scholar",
  "Others"
];

/**
 * Returns available semesters or standard for a given course name
 */
export const getSemestersForCourse = (courseName: string): string[] => {
  if (!courseName) return ALL_SEMESTERS_DEFAULT;
  const c = courseName.toLowerCase();

  if (c.includes('school') || c.includes('class')) {
    return SCHOOL_CLASSES;
  }
  if (c.includes('b.tech') || c.includes('btech') || c.includes('b.e.') || c.includes('b.pharm')) {
    return SEMESTERS_8;
  }
  if (
    c.includes('diploma') ||
    c.includes('polytechnic') ||
    c.includes('bca') ||
    c.includes('bba') ||
    c.includes('b.com') ||
    c.includes('b.sc') ||
    c.includes('ba') ||
    c.includes('b.des')
  ) {
    return SEMESTERS_6;
  }
  if (
    c.includes('mca') ||
    c.includes('m.tech') ||
    c.includes('mba') ||
    c.includes('m.com') ||
    c.includes('m.sc') ||
    c.includes('ma') ||
    c.includes('d.pharm')
  ) {
    return SEMESTERS_4;
  }
  if (c.includes('llb') || c.includes('law')) {
    return SEMESTERS_LAW;
  }
  if (c.includes('ph.d') || c.includes('research')) {
    return SEMESTERS_PHD;
  }

  return SEMESTERS_8;
};

/**
 * Check if the student is from ARKA JAIN University
 */
export const isArkaJainUniversity = (institution: string): boolean => {
  if (!institution) return false;
  return institution.toLowerCase().includes('arka jain');
};

/**
 * Check if the course qualifies for AJU No-Dues payment exemption (B.Tech, BCA, or Diploma)
 */
export const isAjuExemptEngineeringCourse = (course: string): boolean => {
  if (!course) return false;
  const c = course.toLowerCase();
  return (
    c.includes('b.tech') ||
    c.includes('btech') ||
    c.includes('b.e.') ||
    c.includes('bca') ||
    c.includes('diploma') ||
    c.includes('polytechnic')
  );
};
