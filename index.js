// pages/index.js
import Head from 'next/head';
import ExpandingSphere from '../components/ExpandingSphere';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Expanding Sphere in 3D</title>
        <meta name="description" content="A simple 3D expanding sphere built with Three.js and Next.js" />
      </Head>
      <ExpandingSphere />
    </div>
  );
}
