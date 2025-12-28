'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Molecule {
  group: THREE.Group
  velocity: THREE.Vector3
  rotationSpeed: THREE.Vector3
}

export default function MolecularBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const moleculesRef = useRef<Molecule[]>([])
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 30
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting for grayscale effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0x888888, 0.5)
    backLight.position.set(-5, -5, -5)
    scene.add(backLight)

    // Create molecules
    const createMolecule = (complexity: number = 3): THREE.Group => {
      const moleculeGroup = new THREE.Group()
      
      // Grayscale materials with varying shades
      const atomMaterials = [
        new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          metalness: 0.3, 
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0xcccccc, 
          metalness: 0.3, 
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0x888888, 
          metalness: 0.3, 
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0x555555, 
          metalness: 0.3, 
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0x333333, 
          metalness: 0.3, 
          roughness: 0.4,
        }),
      ]

      const bondMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666, 
        metalness: 0.2, 
        roughness: 0.6,
      })

      // Create central atom
      const centralRadius = 0.3 + Math.random() * 0.3
      const centralGeometry = new THREE.SphereGeometry(centralRadius, 16, 16)
      const centralAtom = new THREE.Mesh(
        centralGeometry, 
        atomMaterials[Math.floor(Math.random() * atomMaterials.length)]
      )
      moleculeGroup.add(centralAtom)

      // Create surrounding atoms and bonds
      const numAtoms = complexity + Math.floor(Math.random() * 3)
      
      for (let i = 0; i < numAtoms; i++) {
        // Random position on sphere around center
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const distance = 0.8 + Math.random() * 0.6
        
        const x = distance * Math.sin(phi) * Math.cos(theta)
        const y = distance * Math.sin(phi) * Math.sin(theta)
        const z = distance * Math.cos(phi)

        // Atom
        const atomRadius = 0.15 + Math.random() * 0.2
        const atomGeometry = new THREE.SphereGeometry(atomRadius, 12, 12)
        const atom = new THREE.Mesh(
          atomGeometry,
          atomMaterials[Math.floor(Math.random() * atomMaterials.length)]
        )
        atom.position.set(x, y, z)
        moleculeGroup.add(atom)

        // Bond (cylinder connecting to center)
        const bondLength = distance - centralRadius - atomRadius * 0.5
        const bondGeometry = new THREE.CylinderGeometry(0.04, 0.04, bondLength, 6)
        const bond = new THREE.Mesh(bondGeometry, bondMaterial)
        
        // Position and orient bond
        bond.position.set(x / 2, y / 2, z / 2)
        bond.lookAt(new THREE.Vector3(0, 0, 0))
        bond.rotateX(Math.PI / 2)
        moleculeGroup.add(bond)

        // Sometimes add secondary atoms branching off
        if (Math.random() > 0.6) {
          const branchTheta = theta + (Math.random() - 0.5) * 1.5
          const branchPhi = phi + (Math.random() - 0.5) * 1.5
          const branchDist = 0.5 + Math.random() * 0.3
          
          const bx = x + branchDist * Math.sin(branchPhi) * Math.cos(branchTheta)
          const by = y + branchDist * Math.sin(branchPhi) * Math.sin(branchTheta)
          const bz = z + branchDist * Math.cos(branchPhi)

          const branchAtomRadius = 0.1 + Math.random() * 0.15
          const branchGeometry = new THREE.SphereGeometry(branchAtomRadius, 10, 10)
          const branchAtom = new THREE.Mesh(
            branchGeometry,
            atomMaterials[Math.floor(Math.random() * atomMaterials.length)]
          )
          branchAtom.position.set(bx, by, bz)
          moleculeGroup.add(branchAtom)

          // Branch bond
          const branchBondLength = branchDist - atomRadius - branchAtomRadius * 0.5
          const branchBondGeometry = new THREE.CylinderGeometry(0.03, 0.03, branchBondLength, 5)
          const branchBond = new THREE.Mesh(branchBondGeometry, bondMaterial)
          branchBond.position.set((x + bx) / 2, (y + by) / 2, (z + bz) / 2)
          branchBond.lookAt(new THREE.Vector3(x, y, z))
          branchBond.rotateX(Math.PI / 2)
          moleculeGroup.add(branchBond)
        }
      }

      return moleculeGroup
    }

    // Create multiple molecules scattered across the scene
    const molecules: Molecule[] = []
    const numMolecules = 15

    for (let i = 0; i < numMolecules; i++) {
      const molecule = createMolecule(2 + Math.floor(Math.random() * 4))
      
      // Random scale
      const scale = 0.8 + Math.random() * 2.5
      molecule.scale.set(scale, scale, scale)
      
      // Random position
      molecule.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20 - 10
      )
      
      // Random initial rotation
      molecule.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      scene.add(molecule)
      
      molecules.push({
        group: molecule,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005
        ),
      })
    }

    moleculesRef.current = molecules

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      molecules.forEach((mol) => {
        // Update position
        mol.group.position.add(mol.velocity)
        
        // Update rotation
        mol.group.rotation.x += mol.rotationSpeed.x
        mol.group.rotation.y += mol.rotationSpeed.y
        mol.group.rotation.z += mol.rotationSpeed.z

        // Boundary wrapping
        const bounds = { x: 30, y: 25, z: 20 }
        if (mol.group.position.x > bounds.x) mol.group.position.x = -bounds.x
        if (mol.group.position.x < -bounds.x) mol.group.position.x = bounds.x
        if (mol.group.position.y > bounds.y) mol.group.position.y = -bounds.y
        if (mol.group.position.y < -bounds.y) mol.group.position.y = bounds.y
        if (mol.group.position.z > bounds.z) mol.group.position.z = -bounds.z
        if (mol.group.position.z < -bounds.z) mol.group.position.z = bounds.z
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameRef.current)
      
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }

      molecules.forEach((mol) => {
        mol.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
      })
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)'
      }}
    />
  )
}

