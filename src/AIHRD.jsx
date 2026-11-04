import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Float, Environment } from '@react-three/drei'

// Komponen 3D Robot Hologram
function RobotHRD({ isSpeaking }) {
  const headRef = useRef()
  const mouthRef = useRef()
  const ringRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // 1. Animasi kepala naik turun (napas)
    if (headRef.current) {
      headRef.current.position.y = 2.0 + Math.sin(t * 2) * 0.1 // Posisi kepala disesuaikan
    }

    // 2. Animasi ring berputar
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t) * 0.1
    }

    // 3. Animasi mulut bicara
    if (mouthRef.current) {
      const targetScale = isSpeaking ? 1.5 : 1
      mouthRef.current.scale.y += (targetScale - mouthRef.current.scale.y) * 0.2
    }
  })

  return (
    <group position={[0, -1, 0]}> {/* Geser keseluruhan robot sedikit ke bawah */}
      {/* Kaki / Penyangga Bawah */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.5, 32]} /> {/* Basis yang lebih stabil */}
        <meshStandardMaterial color="#125d98" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Badan Utama */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 2, 1]} /> {/* Badan lebih ramping dan tinggi */}
        <meshStandardMaterial color="#1880d8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Sambungan Leher */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 32]} />
        <meshStandardMaterial color="#125d98" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Kepala (Helm Futuristik) */}
      <group ref={headRef}>
        {/* Bagian utama helm (sphere) */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#00d4ff" metalness={0.8} roughness={0.1} />
        </mesh>
        {/* Visor/bagian depan (box) */}
        <mesh position={[0, 0.2, 0.9]}>
          <boxGeometry args={[1.5, 0.8, 0.2]} />
          <meshStandardMaterial color="#00aaff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
        </mesh>
        {/* Detail samping (torus) */}
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8, 0.1, 16, 32]} />
          <meshStandardMaterial color="#00d4ff" metalness={0.8} roughness={0.1} />
        </mesh>

        {/* Mata - disesuaikan agar di visor */}
        <mesh position={[-0.4, 0.25, 1.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#00d4ff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.4, 0.25, 1.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#00d4ff" emissiveIntensity={2} />
        </mesh>

        {/* Mulut (Animasi Bicara) - disesuaikan agar di visor */}
        <mesh ref={mouthRef} position={[0, -0.2, 1.05]}>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Ring Hologram - Melayang di belakang punggung */}
      <mesh ref={ringRef} position={[0, 0.5, -1]}> {/* Posisi disesuaikan */}
        <torusGeometry args={[1.8, 0.05, 16, 100]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// Komponen Utama
export default function AIHRD({ isSpeaking = false, text = "" }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <Canvas camera={{ position: [0, 2, 7], fov: 50 }}> {/* Kamera disesuaikan */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <RobotHRD isSpeaking={isSpeaking} />
        </Float>

        {/* Teks UI melayang di atas robot */}
        <Html position={[0, 4, 0]} center>
          <div style={{
  background: 'rgba(30, 41, 59, 0.9)',
  color: '#f8fafc',
  padding: '20px',
  borderRadius: '16px',
  fontSize: '18px',
  fontWeight: '500',
  zIndex: 9999,
  maxWidth: '350px',
  width: '350px',
  wordWrap: 'break-word',
  textAlign: 'center',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  lineHeight: '1.5'
}}>
            {text}
          </div>
        </Html>
      </Canvas>
    </div>
  )
}
