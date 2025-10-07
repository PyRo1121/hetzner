'use client';

import React from 'react';

interface TestComponentProps {
  name: string;
  age?: number;
}

export function TestComponent({ name, age }: TestComponentProps) {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>Hello {name}!</h1>
      {age ? <p>Age: {age}</p> : null}
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
