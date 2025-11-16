const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json()); 
app.use(express.static('public')); 


app.get('/api/user', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM "user" WHERE user_id = 1');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/tasks', async (req, res) => {
  try {
    
    const { rows } = await db.query(
      'SELECT * FROM tasks ORDER BY is_complete ASC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/tasks', async (req, res) => {
  const { description, is_repeat } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO tasks (description, is_repeat) VALUES ($1, $2) RETURNING *',
      [description, is_repeat]
    );
    const newTask = rows[0];

    let pointsGained = 2;
    if(is_repeat){
        pointsGained += 5;
    }

    const userRes = await db.query(
        'update "user" set total_points = total_points + $1 Where user_id = 1 returning *',
        [pointsGained]
    );


    const newUserData = userRes.rows[0];
    const newPoints = newUserData.total_points;

    let newRank = 'The Obedient Repeater';
    if(newPoints >=70){
        newRank = 'The Tarnished Repeater';
    }
    else if(newPoints>=50){
        newRank = 'Harrowed Apostle of Repeat';
    }
    else if(newPoints>=41){
        newRank = 'Repeater of the Shattered Cycle';
    }
    else if(newPoints>=26){
        newRank = 'The Shivering Repeat Adept';
    }
    else if(newPoints>=16){
        newRank = 'Keeper of Minor Repeats';
    }

    await db.query('update "user" set rank_name = $1 where user_id = 1', [newRank]);
    newUserData.rank_name = newRank;
   
    res.status(201).json({newTask, newUserData});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/tasks/complete/:id', async (req, res) => {
  const { id } = req.params;
  try {

    const taskRes = await db.query('select * from tasks where task_id = $1', [
      id,
    ]);
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (taskRes.rows[0].is_complete) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    //comp
    await db.query('update tasks set is_complete = true where task_id = $1', [
      id,
    ]);

    //minus
    const pointsLost = -5;
    const userRes = await db.query(
      'update "user" set total_points = total_points + $1 where user_id = 1 returning *',
      [pointsLost]
    );

    

    const newUserData = userRes.rows[0];
    let newPoints = newUserData.total_points;

    
    if (newPoints < 0) {
      newPoints = 0;
      await db.query('UPDATE "user" SET total_points = 0 WHERE user_id = 1');
      newUserData.total_points = 0;
    }

    
     let newRank = 'The Obedient Repeater';
    if(newPoints >=70){
        newRank = 'The Tarnished Repeater';
    }
    else if(newPoints>=50){
        newRank = 'Harrowed Apostle of Repeat';
    }
    else if(newPoints>=41){
        newRank = 'Repeater of the Shattered Cycle';
    }
    else if(newPoints>=26){
        newRank = 'The Shivering Repeat Adept';
    }
    else if(newPoints>=16){
        newRank = 'Keeper of Minor Repeats';
    }

    
    await db.query('UPDATE "user" SET rank_name = $1 WHERE user_id = 1', [
      newRank,
    ]);
    newUserData.rank_name = newRank; 

   
    res.json(newUserData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 5. DELETE (Reset) all data
// app.delete('/api/reset', async (req, res) => {
//   try {
//     // 1. Delete all tasks from the tasks table
//     await db.query('DELETE FROM tasks');

//     // 2. Reset the user's points and rank back to default
//     const { rows } = await db.query(
//       'UPDATE "user" SET total_points = 0, rank_name = $1 WHERE user_id = 1 RETURNING *',
//       ['VSSUT Chuza'] // Your default rank
//     );

//     // 3. Return the newly reset user data
//     res.json(rows[0]);
//   } catch (err) {
//     console.error('Error in DELETE /api/reset:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// 5. DELETE (Reset) all data
app.delete('/api/reset', async (req, res) => {
  try {
    // 1. Delete all tasks from the tasks table
    await db.query('DELETE FROM tasks');

    // 2. Reset the user's points and rank back to default
    //    !! Use your default rank name !!
    const { rows } = await db.query(
      'UPDATE "user" SET total_points = 0, rank_name = $1 WHERE user_id = 1 RETURNING *',
      ['The Obedient Repeater'] 
    );

    // 3. Return the newly reset user data
    res.json(rows[0]);
  } catch (err) {
    console.error('Error in DELETE /api/reset:', err.message);
    res.status(500).json({ error: err.message });
  }
});




app.listen(port, () => {
  console.log(`Swarupper backend running at http://localhost:${port}`);
});