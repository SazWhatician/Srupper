
const API_URL = 'http://localhost:3000/api';


const uiContainer = document.getElementById('ui-container');
const rankDisplay = document.getElementById('rank-display');
const pointsDisplay = document.getElementById('points-display');
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('add-task-form');
const taskInput = document.getElementById('task-input');
const repeatCheckbox = document.getElementById('repeat-checkbox');
const resetButton = document.getElementById('reset-button');




function updateUI(user) {
  rankDisplay.textContent = user.rank_name;
  pointsDisplay.textContent = user.total_points;

  let color = 'blue';
  if (user.total_points >= 70) color = 'black';
  else if (user.total_points >= 50) color = 'red2';
  else if (user.total_points >= 41) color = 'red';
  else if (user.total_points >= 26) color = 'brown';
  else if (user.total_points >= 16) color = 'violet';

 
  uiContainer.setAttribute('data-rank-color', color);
}




function renderTasks(tasks) {
  taskList.innerHTML = ''; 
  tasks.forEach((task) => {
    const taskItem = document.createElement('li');
    taskItem.className =
      'task-item flex justify-between items-center p-4 border-4 border-black bg-white bg-opacity-80';
    taskItem.dataset.id = task.task_id;

    if (task.is_complete) {
      taskItem.classList.add('completed');
    }

    taskItem.innerHTML = `
      <span class="flex-1 ${
        task.is_repeat ? 'text-purple-700 font-bold' : ''
      }">
        ${task.description} ${task.is_repeat ? '(R)' : ''}
      </span>
      ${
        !task.is_complete
          ? `<button class="complete-btn pixel-font ml-4 p-2 text-sm bg-green-500 border-2 border-black hover:bg-green-400">DONE</button>`
          : ''
      }
    `;
    taskList.appendChild(taskItem);

    // Add GSAP "pop-in" animation for new tasks
    gsap.from(taskItem, {
      duration: 0.5,
      scale: 0.5,
      opacity: 0,
      ease: 'back.out(1.7)',
    });
  });
}

// 3. Load initial data (user and tasks)
async function loadInitialData() {
  try {
    const [userRes, tasksRes] = await Promise.all([
      fetch(`${API_URL}/user`),
      fetch(`${API_URL}/tasks`),
    ]);
    const user = await userRes.json();
    const tasks = await tasksRes.json();

    updateUI(user);
    renderTasks(tasks);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// --- EVENT LISTENERS ---

// 1. Add a new task
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = taskInput.value;
  const is_repeat = repeatCheckbox.checked;

  if (!description) return;

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, is_repeat }),
    });
    const {newUserData} = await res.json();

    updateUI(newUserData);

    // Reload all tasks to show the new one
    const tasksRes = await fetch(`${API_URL}/tasks`);
    const tasks = await tasksRes.json();
    renderTasks(tasks);

    // Reset form
    taskInput.value = '';
    repeatCheckbox.checked = false;
  } catch (err) {
    console.error('Failed to add task:', err);
  }
});

// 2. Complete a task
taskList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('complete-btn')) {
    const taskItem = e.target.closest('.task-item');
    const taskId = taskItem.dataset.id;

    try {
      const res = await fetch(`${API_URL}/tasks/complete/${taskId}`, {
        method: 'PUT',
      });
      const newUserData = await res.json();

      // Update the UI with new points
      updateUI(newUserData);

      // "Extreme" animation: Make the button and task disappear
      gsap.to(taskItem, {
        duration: 0.7,
        x: '100%',
        opacity: 0,
        ease: 'power1.in',
        onComplete: () => {
          // Visually mark as complete without full reload
          taskItem.classList.add('completed');
          e.target.remove(); // Remove the button
          gsap.to(taskItem, { x: 0, opacity: 1, duration: 0.5 }); // Slide back in
        },
      });
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  }
});

// 3. Reset all data
resetButton.addEventListener('click', async () => {
  // Add a confirmation pop-up as a safety measure
  if (!confirm('ARE YOU SURE? This will delete all tasks and reset your points!')) {
    return; // Stop if the user clicks "Cancel"
  }

  try {
    const res = await fetch(`${API_URL}/reset`, {
      method: 'DELETE',
    });

    const resetUserData = await res.json();

    // Update the UI (rank, points) with the new data from the server
    updateUI(resetUserData);

    // Clear the task list on the page by rendering an empty array
    renderTasks([]); 

  } catch (err) {
    console.error('Failed to reset data:', err);
  }
});

// --- ANIMATIONS (GSAP & Barba) ---

// GSAP "Super Duper Extreme" Intro Animation
function introAnimation() {
  // Use a timeline for sequencing
  const tl = gsap.timeline();
  tl.from('#title-anim', {
    duration: 1.5,
    scale: 20,
    opacity: 0,
    ease: 'power3.out',
  })
    .from(
      'header div',
      { duration: 1, y: -100, opacity: 0, ease: 'bounce.out' },
      '-=0.5'
    )
    .from(
      '#add-task-form > *',
      {
        duration: 0.5,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: 'back.out(1.7)',
      },
      '-=0.5'
    )
    .from(
      '#task-list',
      { duration: 0.5, opacity: 0, scaleY: 0 },
      '-=0.5'
    );
}

// Barba Page Transition
function pageTransition() {
  barba.init({
    transitions: [
      {
        name: 'pixel-transition',
        // How to leave the page
        leave(data) {
          return gsap.to(data.current.container, {
            duration: 0.5,
            scale: 0.8,
            opacity: 0,
            ease: 'power1.in',
          });
        },
        // How to enter the page
        enter(data) {
          // Reset scroll and styles
          window.scrollTo(0, 0);
          gsap.from(data.next.container, {
            duration: 0.7,
            y: '100vh',
            rotation: 15,
            opacity: 0,
            ease: 'power2.out',
          });
          // Re-run the intro animation for the new page
          introAnimation();
        },
      },
    ],
  });
}

// --- INITIALIZE ---
function init() {
  loadInitialData();
  introAnimation();
  // We only have one page, so pageTransition() is for show,
  // but if you added an "About" page, it would work.
  // pageTransition(); 
}

// Run everything when the page loads
document.addEventListener('DOMContentLoaded', init);