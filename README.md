# Pixel Animator

**Visual Interface for Generative Animations**

A web-based tool for creating black and white generative animations without writing code. Built to provide a simple interface for exploring p5.js-style creative coding concepts through visual controls rather than programming.

## 🎯 Purpose

This project was created to solve a specific need: **generating p5.js-style animations without writing code**. Instead of manually coding animation loops, mathematical functions, and parameter adjustments, this tool provides a visual interface where you can:

- Select from pre-built animation algorithms
- Adjust parameters through sliders and controls
- See results in real-time
- Share configurations with others

The entire application was built through AI collaboration, demonstrating how AI can help create functional creative tools quickly and efficiently.

## ✨ What It Does

### Core Functionality
- **11 Animation Effects**: Pre-built algorithms covering geometric patterns, organic movements, and retro aesthetics
- **Real-Time Parameter Control**: Adjust speed, size, density, and other properties with immediate visual feedback
- **Deterministic Generation**: Seed-based system ensures the same settings always produce the same animation
- **Preset Management**: Save and load parameter configurations
- **Sharing**: Generate URLs to share specific animation settings

### Available Effects
- **Square Drift**: Floating geometric shapes
- **ASCII Dither**: Text-based visual patterns
- **Cellular Automata**: Rule-based emerging patterns
- **Orbiting Bars**: Rotating geometric elements
- **Ripple Quantized**: Wave distortion effects
- **Scanline Reveal**: Progressive line-based reveals
- **Grid**: Structured geometric layouts
- **Particle**: Physics-based particle movement
- **Geometric**: Mathematical shape arrangements
- **Typographic**: Text-based animations
- **Custom Demo**: Advanced parameter showcase

## 🛠️ Technical Details

### Technology Stack
- **Next.js 15**: React framework with TypeScript
- **p5.js**: Creative coding library for canvas rendering
- **Tailwind CSS v4**: Utility-first styling
- **Zustand**: State management

### Key Features
- Seed-based random number generation for reproducible results
- Custom parameter types (sliders, color pickers, vector controls)
- Real-time canvas rendering optimized for smooth playback
- Responsive design that works on desktop and mobile
- URL-based sharing system

## 🚀 Getting Started

### Installation
```bash
# Clone the repository
git clone https://github.com/lorentsob/anim-ui.git

# Install dependencies
cd anim-ui
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000/editor](http://localhost:3000/editor) to use the tool.

### Usage
1. **Choose an effect** from the dropdown menu
2. **Adjust parameters** using the controls in the right panel
3. **Try different seeds** using the "Random Seed" button for variations
4. **Save presets** to remember configurations you like
5. **Share** by copying the URL which includes your current settings

## 🎨 Use Cases

This tool is useful for:
- **Creative exploration** without needing to code
- **Rapid prototyping** of animation concepts
- **Learning** generative art principles through hands-on experimentation
- **Creating** simple animations for presentations or social media
- **Understanding** how parameters affect visual output

## 🤖 AI Development

This project demonstrates practical AI-assisted development:

### Development Approach
- **Human direction**: Defined the goal and user experience requirements
- **AI implementation**: Built components, logic, and interfaces
- **Iterative refinement**: Made adjustments based on testing and feedback

### Benefits Demonstrated
- **Rapid prototyping**: From concept to working tool in a short timeframe
- **Technical problem-solving**: AI handled complex canvas rendering and state management
- **Code quality**: Consistent TypeScript implementation with proper error handling

## 📊 Project Stats

- **11** animation algorithms
- **~150KB** total bundle size
- **TypeScript** throughout for type safety
- **Zero external API dependencies**
- **Responsive** design for mobile and desktop

## 🤝 Contributing

The codebase is well-structured for additional effects or UI improvements:

1. **Adding effects**: Create new files in `src/effects/` following the existing pattern
2. **UI improvements**: Components are modular and use consistent styling
3. **Parameter types**: Custom controls can be extended in `src/components/CustomParamControls.tsx`

## 💬 Feedback & Contact

I'd love to hear your thoughts on this project! Whether you found it useful, have suggestions for improvements, or encountered any issues, your feedback is valuable.

**Get in touch:**
- **GitHub Issues**: [Report bugs or suggest features](https://github.com/lorentsob/anim-ui/issues)
- **Email**: Feel free to reach out directly with feedback or questions
- **Social Media**: Share your creations and tag me to see what you've made!

Your input helps improve the tool and demonstrates real-world usage of AI-assisted development.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📝 Notes

This tool bridges the gap between visual creativity and technical implementation. Instead of learning p5.js syntax and animation programming, users can focus on exploring visual concepts through direct manipulation of parameters.

The project shows how AI can help create specialized creative tools that serve specific workflows - in this case, making generative animation accessible without requiring programming knowledge.

---

**Created by Lorenzo Boschi** | Built with AI assistance to demonstrate practical creative tool development