Instructions to run:

- clone repository and 'cd' to his root

- npm install

- npm start


Remarks:

- Click "Generate chart" at the bottom of screen in order to generate random (but coherent) data. The button will be disabled until the simulations ends.

- Because of time available, I didn't customize colors for data provided in textarea and I didn't make the enumeration in its 'sidebar'. Later I intend to spend some time by myself trying to do this part, it seems challenging.

- For practicality, I chose to make my own HTML for the legends instead of using the structure provided by the chart lib (Recharts), because I'd need to spend time reading documentation and risk not being able to do it the way asked.

- I know <textarea> already has the vertical resizing feature, but I had problem arranging with the responsivity from the chart HTML element, so I decided to make (again) my own structure for that. It's simple, I only used the HTML draging event and had a variable state saving the height while it moved. 

- The icying on the cake for me: I know the "G0Option1" thing sucks because it sounds lazy, but I made it this way because the generating algorithm allows flexible groupings. At the first two lines of 'generateInputData()' function you can set the amount of variables, the amount of groups AND the amount of options for them, then there are built in 'iterate()'. I needed to spend some time to think about this, because it follows a tensor logic. It was totally worth it.

