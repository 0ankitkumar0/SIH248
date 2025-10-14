import '../styles/globals.css'
import React from 'react'

// Register Chart.js components required for Line charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
