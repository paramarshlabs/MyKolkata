import type { Metadata } from 'next'
import { SectionHead } from '@/components/brand/SectionHead'
import { CityIcon } from '@/components/brand/icons'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Transport' }

const MODES = [
  { icon: 'tram', name: 'Metro and trams', note: 'Next trains on the Blue and Green lines' },
  { icon: 'howrah', name: 'Local trains', note: 'Howrah, Sealdah, Santragachi and Shalimar' },
  { icon: 'taxi', name: 'Taxis and autos', note: 'Stands near you, and the walk to each' },
  { icon: 'boat', name: 'Ferries', note: 'Crossings on the Hooghly, ghat to ghat' },
] as const

async function Transport() {
  await requireUser()

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="Transport"
          lede="Live metro, train, bus, auto and taxi times for Kolkata. On its way — check back soon."
          action={<span className="mk-tag mk-tag--warn">Coming soon</span>}
        />
        <ul className="mk-transport-modes">
          {MODES.map((mode) => (
            <li key={mode.name} className="mk-surface mk-transport-mode">
              <CityIcon name={mode.icon} />
              <div>
                <p className="mk-card-title" style={{ fontSize: 20 }}>{mode.name}</p>
                <p className="mk-caption" style={{ marginTop: 4 }}>{mode.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default Transport

// ---------------------------------------------------------------------------
// Previous implementation, commented out while the page shows "Coming Soon".
// It predates the brand migration: its data flow (/api/transport, the category
// filters) is still the reference, but its markup uses the retired Tailwind
// palette and react-icons. Rebuild the UI from components/brand before restoring.
// ---------------------------------------------------------------------------
//
// import React, { useEffect, useState } from 'react';
// import { FaTrain, FaSubway, FaTaxi, FaBus } from 'react-icons/fa';
//
// function Transport() {
//   const [transport, setTransport] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//
//   useEffect(() => {
//     async function fetchTransport() {
//       try {
//         setLoading(true);
//         const res = await fetch('/api/transport');
//         if (!res.ok) throw new Error('Failed to fetch transport data');
//         const data = await res.json();
//         setTransport(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchTransport();
//   }, []);
//
//   if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
//   if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
//
//   // Categorize
//   const autoStands = transport.filter(t => t.category === 'auto');
//   const busStands = transport.filter(t => t.category === 'bus');
//   const taxiStands = transport.filter(t => t.category === 'taxi');
//   const metroNearest = transport.filter(t => t.category === 'metro' && t.name);
//   const metroNorthLine = transport.filter(t => t.category === 'metro' && t.from && t.to && t.time && t.from === 'Kavi Subhash');
//   const metroDakshineswarLine = transport.filter(t => t.category === 'metro' && t.from && t.to && t.time && t.from === 'Dakshineswar');
//   const trainHowrah = transport.filter(t => t.category === 'train' && ['Bandel Local','Burdwan Express','Katwa Local'].includes(t.name));
//   const trainSealdah = transport.filter(t => t.category === 'train' && ['Barrackpore Local','Naihati Local','Krishnanagar Express'].includes(t.name));
//   const trainSantragachi = transport.filter(t => t.category === 'train' && ['Kharagpur Local','Midnapore Express','Haldia Local'].includes(t.name));
//   const trainShalimar = transport.filter(t => t.category === 'train' && ['Puri Express','Digha Local','Kharagpur Fast'].includes(t.name));
//
//   return (
//     <div className="min-h-screen p-4 pt-20">
//       <h1 className="text-2xl font-bold mb-6">Transport</h1>
//       {/* Local Transport Section */}
//       <div className="mb-8">
//         <div className="space-y-6">
//           {/* Auto Stands */}
//           <div>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="bg-yellow-100 p-3 rounded-lg">
//                 <FaTaxi className="text-yellow-600" size={24} />
//               </div>
//               <h2 className="text-xl font-bold">Auto Stands</h2>
//             </div>
//             <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//               {autoStands.map((stand, index) => (
//                 <div key={stand._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-bold">{stand.name}</p>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">Walking time: {stand.time}</p>
//                     </div>
//                     <span className="text-yellow-600 font-bold">{stand.distance}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {/* Bus Stands */}
//           <div>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="bg-blue-100 p-3 rounded-lg">
//                 <FaBus className="text-blue-600" size={24} />
//               </div>
//               <h2 className="text-xl font-bold">Bus Stands</h2>
//             </div>
//             <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//               {busStands.map((stand, index) => (
//                 <div key={stand._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-bold">{stand.name}</p>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">Walking time: {stand.time}</p>
//                       {stand.routes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Routes: {stand.routes.join(', ')}</p>}
//                     </div>
//                     <span className="text-blue-600 font-bold">{stand.distance}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {/* Taxi Stands */}
//           <div>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="bg-green-100 p-3 rounded-lg">
//                 <FaTaxi className="text-green-600" size={24} />
//               </div>
//               <h2 className="text-xl font-bold">Taxi Stands</h2>
//             </div>
//             <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//               {taxiStands.map((stand, index) => (
//                 <div key={stand._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-bold">{stand.name}</p>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">Walking time: {stand.time}</p>
//                     </div>
//                     <span className="text-green-600 font-bold">{stand.distance}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Metro Section */}
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-purple-100 p-3 rounded-lg">
//             <FaSubway className="text-purple-600" size={24} />
//           </div>
//           <h2 className="text-xl font-bold">Metro Railway</h2>
//         </div>
//         {/* Nearest Metro Stations */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold mb-3">Nearest Metro Stations</h3>
//           <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//             {metroNearest.map((station, index) => (
//               <div key={station._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="font-bold">{station.name}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400">{station.time}</p>
//                   </div>
//                   <span className="text-purple-600 font-bold">{station.distance}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//         {/* North Line */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold mb-3">North Line Schedule</h3>
//           <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//             {metroNorthLine.map((train, index) => (
//               <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="font-bold">{train.from} → {train.to}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400">Next train at {train.time}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//         {/* Dakshineswar Line */}
//         <div className="mb-6">
//           <h3 className="text-lg font-semibold mb-3">Dakshineswar Line Schedule</h3>
//           <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//             {metroDakshineswarLine.map((train, index) => (
//               <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="font-bold">{train.from} → {train.to}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400">Next train at {train.time}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       {/* Train Sections */}
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-purple-100 p-3 rounded-lg">
//             <FaTrain className="text-purple-600" size={24} />
//           </div>
//           <h2 className="text-xl font-bold">Howrah Station</h2>
//         </div>
//         <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//           {trainHowrah.map((train, index) => (
//             <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-bold">{train.name}</p>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Platform {train.platform}</p>
//                 </div>
//                 <span className="text-purple-600 font-bold">{train.time}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-purple-100 p-3 rounded-lg">
//             <FaTrain className="text-purple-600" size={24} />
//           </div>
//           <h2 className="text-xl font-bold">Sealdah Station</h2>
//         </div>
//         <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//           {trainSealdah.map((train, index) => (
//             <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-bold">{train.name}</p>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Platform {train.platform}</p>
//                 </div>
//                 <span className="text-purple-600 font-bold">{train.time}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-purple-100 p-3 rounded-lg">
//             <FaTrain className="text-purple-600" size={24} />
//           </div>
//           <h2 className="text-xl font-bold">Santragachi Station</h2>
//         </div>
//         <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//           {trainSantragachi.map((train, index) => (
//             <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-bold">{train.name}</p>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Platform {train.platform}</p>
//                 </div>
//                 <span className="text-purple-600 font-bold">{train.time}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="bg-purple-100 p-3 rounded-lg">
//             <FaTrain className="text-purple-600" size={24} />
//           </div>
//           <h2 className="text-xl font-bold">Shalimar Station</h2>
//         </div>
//         <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
//           {trainShalimar.map((train, index) => (
//             <div key={train._id || index} className="card flex-shrink-0" style={{ width: '250px' }}>
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-bold">{train.name}</p>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Platform {train.platform}</p>
//                 </div>
//                 <span className="text-purple-600 font-bold">{train.time}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
//
// export default Transport;