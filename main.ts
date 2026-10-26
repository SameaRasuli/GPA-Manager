//define the structure of a course

interface Course {
    id: number;
    name: string;
    credits: number;
    grade: number;

};

// load saved courses from localstroage.
let courses: Course[] = JSON.parse(localStorage.getItem("courses") || "[]");

//get the course from and input elements from HTML.
const courseForm = document.getElementById("course-form") as HTMLFormElement;
const courseNameInput = document.getElementById("course-name") as HTMLInputElement;
const courseCreditsInput = document.getElementById("course-credits") as HTMLInputElement;
const courseGradeInput = document.getElementById("course-grade") as HTMLInputElement;
const coursesList = document.getElementById("courses-list") as HTMLTableSectionElement;
const currentGpa = document.getElementById("current-gpa") as HTMLSpanElement;
const totalCredits = document.getElementById("total-credits") as HTMLSpanElement;
const totalCourse = document.getElementById("total-courses") as HTMLSpanElement;
const averageGrade = document.getElementById("average-grade") as HTMLParagraphElement;
const highestGrade = document.getElementById("highest-grade") as HTMLParagraphElement;
const lowestGrade = document.getElementById("lowest-grade") as HTMLParagraphElement;
const analyticsCoursesList = document.getElementById("analytics-courses-list") as HTMLTableSectionElement;
const gradeChartBars = document.getElementById("grade-chart-bars") as HTMLDivElement;
const predictorForm = document.getElementById("predictor-form") as HTMLFormElement;
const targetGpaInput = document.getElementById("target-gpa") as HTMLInputElement;
const futureCreditsInput = document.getElementById("future-credits") as HTMLInputElement;
const predictorCurrentGpa = document.getElementById("predictor-current-gpa") as HTMLParagraphElement;
const predictorResult = document.getElementById("prediction-result") as HTMLDivElement;
const targetGpaDisplay = document.getElementById("target-gpa-display") as HTMLParagraphElement;
const darkModeToggle = document.getElementById("dark-mode-toggle") as HTMLInputElement;
const resetDataBtn = document.getElementById("reset-data-btn") as HTMLButtonElement;
const gpaScaleSelect = document.getElementById("gpa-scale") as HTMLSelectElement;
const themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement;

//RESTORE THE SAVED GPA SCALE.
if (gpaScaleSelect) {
    const savedScale = localStorage.getItem("gpaScale") || "20";

    gpaScaleSelect.value = savedScale;

    //update the displayed GPA when the scale changes.
    gpaScaleSelect.addEventListener("change", () => {
        localStorage.setItem("gpaScale", gpaScaleSelect.value);
         calculateGPA();
         calculateAnalytics();
         displayAnalyticsCourses();
         displayGradeChart();
    });

   
}

//handle the reset button.
if (resetDataBtn) {
    resetDataBtn.addEventListener("click", () => {
        const confirmReset = confirm(
            "Are you sure you want to delete all course data?"
        );

        //stop if the user cancels.
        if (!confirmReset) {
            return;
        }

        //clear all courses and saved the changes.
        courses = [];
        saveCourses();
        displayCourses();
        calculateGPA();
        calculateAnalytics();
        displayAnalyticsCourses();
        displayGradeChart();
        displayPredictorGPA();

    });
}

//check the saved dark mood setting.
const saveDarkMode = localStorage.getItem("darkMode") === "true";

document.body.classList.toggle("dark-mode", saveDarkMode);

if (themeToggle) {
    themeToggle.textContent = saveDarkMode ? "Light Mode" : "Dark Mode";

    themeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");

        localStorage.setItem("darkMode", String(isDarkMode));

        themeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";

        if (darkModeToggle) {
            darkModeToggle.checked = isDarkMode;
        }
    });
}

//handle the dark mode checkbox in setting.

if (darkModeToggle) {
    darkModeToggle.checked = saveDarkMode;
    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle(
            "dark-mode",
            darkModeToggle.checked
        );
        localStorage.setItem("darkMode", String(darkModeToggle.checked));
    });
}

//handle the courses from submission.
if (courseForm) {
courseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const creditsValue = courseCreditsInput.value.trim();
    const gradeValue = courseGradeInput.value.trim();

    const courseName = courseNameInput.value.trim();
    const credits = Number(courseCreditsInput.value);
    const grade = Number(courseGradeInput.value);

    //check if the course information is vaild.
    if (
        courseName === "" ||
        creditsValue === "" ||
        gradeValue === "" ||
        !Number.isFinite(credits) ||
        !Number.isFinite(grade) ||
        credits <= 0 ||
        grade < 0 ||
        grade > 20 
       
    ) {
        //show an error message fro invaild input.
        alert("Please enter valid course information.");
        return;
    }


    //create a new course object.
    const newCourse: Course = {
        id: Date.now(),
        name: courseName,
        credits: credits,
        grade: grade
    };

    courses.push(newCourse);
    saveCourses();
    displayCourses();
    courseForm.reset();
    calculateGPA();
    calculateAnalytics();
    displayAnalyticsCourses();



});
}

//dispaly all courses in the dashboard tables.
function displayCourses(): void {

    if (!coursesList) {
        return;
    }

    coursesList.innerHTML = "";

    //create a table row for each courses.
    courses.forEach((course) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${course.name}</td>
        <td>${course.credits}</td>
        <td>${course.grade}</td>
        <td> 
        <span class = "${course.grade  >= 10 ? "passed" : "failed"}"> 
        ${course.grade  >= 10 ? "Passed" : "Failed"}
        </span>
        </td>
        <td>
        <button class = "delete-btn" data-id = "${course.id}">
        Delete
        </button>
        </td>

        `;

        coursesList.appendChild(row);

        //delete the selected course when its button is clicked.
        row.querySelector(".delete-btn")?.addEventListener("click", () => {
            courses = courses.filter((item) => item.id !== course.id);
            saveCourses();
            displayCourses();
            calculateGPA();
            calculateAnalytics();
            displayAnalyticsCourses();

        });
    });
}

//calculate the GPA and total courses iformation.
function calculateGPA(): void {

    // Stop if the required dashboard elements are missing.
    if (!currentGpa || !totalCredits || !totalCourse) {
        return;
    }

    // Calculate the total number of credits.
    const creditsSum = courses.reduce(
        (sum, course) => sum + course.credits, 0
    );

    // Calculate the total weighted grades.
    const weightedSum = courses.reduce(
        (sum, course) => sum + course.grade * course.credits, 0
    );

    const gpa = creditsSum === 0 ? 0 :
    weightedSum / creditsSum;

    const scale = localStorage.getItem("gpaScale") || "20";

    const displayGpa = 
    scale === "4" ? (gpa / 20) * 4 : 
    scale === "100" ? (gpa / 20) * 100 :
    gpa;

    currentGpa.textContent = displayGpa.toFixed(2);


    //Display the total credits and number of courses.
    totalCredits.textContent = String(creditsSum);

    totalCourse.textContent = String(courses.length);
}

// Save the courses in localStorage.
function saveCourses(): void {
    localStorage.setItem("courses", JSON.stringify(courses)
    );
}

// Run these functions when the script loads.
displayCourses();
calculateGPA();
calculateAnalytics();
displayAnalyticsCourses();
displayGradeChart();
displayPredictorGPA();

function calculateAnalytics(): void {
    if (!averageGrade || !highestGrade || !lowestGrade){
        return;
    }

    if (courses.length === 0) {
        averageGrade.textContent = "0.00";
        highestGrade.textContent = "0.00";
        lowestGrade.textContent = "0.00";
        return;
    }

    const grades = courses.map((course) => course.grade);

    //Calculate the average, highest, and lowest grades.
    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    const scale = localStorage.getItem("gpaScale") || "20";

    const convertGrade = (grade: number): number => {
        if (scale === "4") {
            return (grade / 20) * 4;
        }

        if (scale === "100") {
            return (grade / 20) * 100;
        }

        return grade;
    };

    // Display the calculated grades with two decimal places.
    averageGrade.textContent = convertGrade(average).toFixed(2);
    highestGrade.textContent = convertGrade(highest).toFixed(2);
    lowestGrade.textContent = convertGrade(lowest).toFixed(2);
}


// Display course information in the analytics table.
function displayAnalyticsCourses(): void {
    if (!analyticsCoursesList) {
        return;
    }

    analyticsCoursesList.innerHTML = "";

    if (courses.length === 0) {
        analyticsCoursesList.innerHTML = `
        <tr>
        <td colspan="4">No course data available yet</td>
        </tr>
        
        `;

        return;
    }

    courses.forEach((course) => {
        const row = document.createElement("tr");

        const scale = localStorage.getItem("gpaScale") || "20";

        const displayedGrade =
    scale === "4" ? (course.grade / 20) * 4 :
    scale === "100" ? (course.grade / 20) * 100 :
    course.grade;

        row.innerHTML = `
        <td>${course.name}</td>
        <td> ${displayedGrade.toFixed(2)}</td>
        <td>${course.credits}</td>
        <td>
        <span class = "${course.grade >= 10 ? "passed" : "failed"}">
        ${course.grade >= 10 ? "Passed" : "Failed"}
        </span>
        </td>
        
        `;

        analyticsCoursesList.appendChild(row);
    });
}

// Display course grades as bars in the chart.
function displayGradeChart(): void {
    if (!gradeChartBars) {
        return;
    }

    gradeChartBars.innerHTML = "";

    courses.forEach((course) => {
        const bar = document.createElement("div");

        const scale = localStorage.getItem("gpaScale") || "20";

        const displayedGrade =
    scale === "4" ? (course.grade / 20) * 4 :
    scale === "100" ? (course.grade / 20) * 100 :
    course.grade;

        bar.className = "grade-bar";
        bar.style.width = "100%";
        bar.style.height = `${(displayedGrade / (scale === "4" ? 4 : scale === "100" ? 100 : 20)) * 180}px`;
        bar.innerHTML = `
        <span class="bar-grade">${displayedGrade.toFixed(2)}</span>
        <span class="bar-name">${course.name}</span>
        
        `;

        gradeChartBars.appendChild(bar);
    });
}


// Display course grades as bars in the chart.
function displayPredictorGPA(): void {
    if (!predictorCurrentGpa) {
        return;
    }

    const totalCredits = courses.reduce(
        (sum, course) => sum + course.credits, 0
    );

    const weightedSum = courses.reduce(
        (sum, course) => sum + course.grade * course.credits, 0
    );

    const gpa = totalCredits === 0 ? 0 :
    weightedSum / totalCredits;
    const scale = localStorage.getItem("gpaScale") || "20";

    const displayGpa =
    scale === "4" ? (gpa / 20 ) * 4 :
    scale === "100" ? (gpa / 20) * 100:
    gpa;


    predictorCurrentGpa.textContent = displayGpa.toFixed(2);
}

if (predictorForm) {
    predictorForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (courses.length === 0){
            predictorResult.innerHTML = `
            <p> Please add at least one course before calculating your GPA prediction.</p>
            
            `;
            return;
        }

    const targetGpa = Number(targetGpaInput.value);

    const scale = localStorage.getItem("gpaScale") || "20";

    const targetGpa20 = scale === "4" ? (targetGpa * 5) :
    scale === "100" ? (targetGpa / 5) : 
    targetGpa
        const futureCredits = Number(futureCreditsInput.value);

        if (
            targetGpaInput.value.trim() === "" || futureCreditsInput.value.trim() === "" ||
            targetGpa < 0 ||
            (targetGpa > (scale === "4" ? 4 : scale === "100" ? 100 : 20)) ||
            futureCredits <= 0


        ) {
            alert("Please enter valid target GPA and future credits.");
            return;
        }

        targetGpaDisplay.textContent = targetGpa.toFixed(2);
        
    const currentCredits = courses.reduce(
        (sum, course) => sum + course.credits, 0
    );

    const currentWeightedPoints = courses.reduce(
        (sum, course) => sum + course.grade * course.credits, 0
    );

    const requiredGrade = (targetGpa20 * (currentCredits + futureCredits) - 
    currentWeightedPoints) / futureCredits;


    const displayRequiredGrade = 
    scale === "4" ? (requiredGrade / 20) * 4:
    scale === "100" ? (requiredGrade / 20) * 100 :
    requiredGrade;

    if (requiredGrade > 20) {
    const maximumGpa =
        (currentWeightedPoints + 20 * futureCredits) /
        (currentCredits + futureCredits);

    predictorResult.innerHTML = `
        <p>You need a GPA of ${requiredGrade.toFixed(2)}, 
        which is above 20. Your target is not achievable 
        with these future credits.</p>

        <p>If you get 20 in all future courses, 
        your maximum GPA will be 
        <strong>${maximumGpa.toFixed(2)}</strong>.</p>
    `;


    } else {
        predictorResult.innerHTML = `
        <p> You need an average grade of <strong>${displayRequiredGrade.toFixed(2)}</strong>

        in your future courses to reach your target GPA.</p>
        
        `;
    }

    predictorForm.reset();

    });

    

}







