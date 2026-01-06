const commentaryTemplates = {
  dot: [
    "{bowler} to {batsman}, no run, solid defense back to the bowler",
    "{bowler} to {batsman}, no run, left alone outside off stump",
    "{bowler} to {batsman}, no run, defended off the front foot",
    "{bowler} to {batsman}, no run, blocked back down the pitch",
    "{bowler} to {batsman}, no run, watchful leave"
  ],
  single: [
    "{bowler} to {batsman}, 1 run, {shot} towards {area}, quick single taken",
    "{bowler} to {batsman}, 1 run, worked away to {area} for a single",
    "{bowler} to {batsman}, 1 run, nudged into the gap at {area}",
    "{bowler} to {batsman}, 1 run, {shot} played to {area}"
  ],
  double: [
    "{bowler} to {batsman}, 2 runs, {shot} in the gap at {area}, they come back for two",
    "{bowler} to {batsman}, 2 runs, well placed through {area}, comfortable two",
    "{bowler} to {batsman}, 2 runs, {shot} past {area}, good running between the wickets"
  ],
  triple: [
    "{bowler} to {batsman}, 3 runs, lovely {shot} through {area}, long chase for the fielder",
    "{bowler} to {batsman}, 3 runs, beautifully timed to {area}, pulled back just inside the rope"
  ],
  four: [
    "{bowler} to {batsman}, FOUR! Glorious {shot} through {area}",
    "{bowler} to {batsman}, FOUR! Cracking {shot}, races away to the {area} boundary",
    "{bowler} to {batsman}, FOUR! Beautiful timing, {shot} beats the fielder at {area}",
    "{bowler} to {batsman}, FOUR! What a shot! {shot} dispatched to {area}"
  ],
  six: [
    "{bowler} to {batsman}, SIX! Massive hit! {shot} sails over {area}",
    "{bowler} to {batsman}, SIX! That's out of here! Towering {shot}",
    "{bowler} to {batsman}, SIX! Clean strike! {shot} clears {area} with ease",
    "{bowler} to {batsman}, SIX! Into the stands! Powerful {shot}"
  ],
  wide: [
    "{bowler} to {batsman}, WIDE! Down the leg side",
    "{bowler} to {batsman}, WIDE! Too wide outside off",
    "{bowler} to {batsman}, WIDE! Strays down leg"
  ],
  noBall: [
    "{bowler} to {batsman}, NO BALL! Overstepping, free hit coming up",
    "{bowler} to {batsman}, NO BALL! That's overstepped"
  ],
  bye: [
    "{bowler} to {batsman}, {runs} bye{plural}, keeper misses it",
    "{bowler} to {batsman}, {runs} bye{plural}, goes past everyone"
  ],
  legBye: [
    "{bowler} to {batsman}, {runs} leg bye{plural}, off the pads",
    "{bowler} to {batsman}, {runs} leg bye{plural}, hits the pad and runs away"
  ],
  bowled: [
    "{bowler} to {batsman}, OUT! BOWLED! Cleaned him up! The stumps are shattered!",
    "{bowler} to {batsman}, OUT! BOWLED! Timber! What a delivery!",
    "{bowler} to {batsman}, OUT! BOWLED! Through the gate! Middle stump out of the ground!"
  ],
  caught: [
    "{bowler} to {batsman}, OUT! CAUGHT! {shot} goes straight to {area}, simple catch",
    "{bowler} to {batsman}, OUT! CAUGHT! In the air and taken at {area}!",
    "{bowler} to {batsman}, OUT! CAUGHT! {shot} finds the fielder perfectly at {area}"
  ],
  lbw: [
    "{bowler} to {batsman}, OUT! LBW! Trapped in front, that's plumb!",
    "{bowler} to {batsman}, OUT! LBW! Finger goes up! Dead in front!",
    "{bowler} to {batsman}, OUT! LBW! Hitting middle and leg, no doubt about it!"
  ],
  runOut: [
    "{bowler} to {batsman}, OUT! RUN OUT! Brilliant throw! {batsman} is short of the crease!",
    "{bowler} to {batsman}, OUT! RUN OUT! Mix-up in the middle! {batsman} has to go!",
    "{bowler} to {batsman}, OUT! RUN OUT! Direct hit! {batsman} is gone!"
  ],
  stumped: [
    "{bowler} to {batsman}, OUT! STUMPED! Beaten by the turn, keeper does the rest!",
    "{bowler} to {batsman}, OUT! STUMPED! Out of the crease, lightning quick glovework!",
    "{bowler} to {batsman}, OUT! STUMPED! Down the track and misses, easy for the keeper!"
  ],
  hitWicket: [
    "{bowler} to {batsman}, OUT! HIT WICKET! Unfortunate dismissal, disturbed his own stumps!",
    "{bowler} to {batsman}, OUT! HIT WICKET! Stepped back onto the stumps!"
  ]
};

const shots = ['drive', 'pull', 'cut', 'sweep', 'straight drive', 'flick', 'clip'];
const areas = ['cover', 'mid-wicket', 'square leg', 'point', 'long on', 'long off', 'fine leg', 'third man'];

export const generateCommentary = (ball, batsman, bowler) => {
  let template;
  let eventType;

  // Determine event type
  if (ball.isWicket) {
    eventType = ball.dismissalType.toLowerCase().replace(' ', '');
  } else if (ball.extras?.wide) {
    eventType = 'wide';
  } else if (ball.extras?.noBall) {
    eventType = 'noBall';
  } else if (ball.extras?.bye > 0) {
    eventType = 'bye';
  } else if (ball.extras?.legBye > 0) {
    eventType = 'legBye';
  } else if (ball.runs === 0) {
    eventType = 'dot';
  } else if (ball.runs === 1) {
    eventType = 'single';
  } else if (ball.runs === 2) {
    eventType = 'double';
  } else if (ball.runs === 3) {
    eventType = 'triple';
  } else if (ball.runs === 4) {
    eventType = 'four';
  } else if (ball.runs === 6) {
    eventType = 'six';
  }

  // Get random template for event type
  const templates = commentaryTemplates[eventType] || commentaryTemplates.dot;
  template = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders
  let commentary = template
    .replace(/\{bowler\}/g, bowler)
    .replace(/\{batsman\}/g, batsman)
    .replace(/\{shot\}/g, ball.shot || shots[Math.floor(Math.random() * shots.length)])
    .replace(/\{area\}/g, ball.area || areas[Math.floor(Math.random() * areas.length)]);

  // Handle bye/legbye plurals and runs
  if (eventType === 'bye' || eventType === 'legBye') {
    const runs = ball.extras?.bye || ball.extras?.legBye || 1;
    commentary = commentary
      .replace(/\{runs\}/g, runs)
      .replace(/\{plural\}/g, runs > 1 ? 's' : '');
  }

  return commentary;
};

export default { generateCommentary };
