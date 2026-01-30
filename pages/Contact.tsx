import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, Globe, Instagram, Facebook, MessageCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSubmitted(true);
    setIsSubmitting(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-stone-950 relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.03, 0.1, 0.03]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-screen-xl mx-auto px-6 md:px-12 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <Sparkles className="text-amber-500" size={32} />
            <h1 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 tracking-wider">
              Get in Touch
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-stone-400 text-lg max-w-2xl mx-auto detail-text leading-relaxed"
          >
            Whether you're interested in acquiring a piece, scheduling a private viewing, or simply wish to discuss art, we'd love to hear from you.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-amber-500/60 uppercase tracking-[0.3em] text-xs mt-4"
          >
            We're Here to Assist You
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500">
              <h2 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-8 tracking-wide">Visit Our Gallery</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1 tracking-wide">Address</h3>
                    <p className="text-stone-400 text-sm detail-text leading-relaxed">
                      DHA Phase 6, Lahore<br />
                      Punjab, Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1 tracking-wide">Phone</h3>
                    <p className="text-stone-400 text-sm detail-text">+92 300 123 4567</p>
                    <p className="text-stone-400 text-sm detail-text">+92 42 3456 7890</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1 tracking-wide">Email</h3>
                    <p className="text-stone-400 text-sm detail-text">support@muraqqa.art</p>
                    <p className="text-stone-400 text-sm detail-text">gallery@muraqqa.art</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1 tracking-wide">Website</h3>
                    <p className="text-stone-400 text-sm detail-text">www.muraqqa.art</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Hours */}
            <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500">
              <h2 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-6 tracking-wide">Gallery Hours</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Monday - Friday</span>
                  <span className="text-white font-medium">10:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Saturday</span>
                  <span className="text-white font-medium">11:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Sunday</span>
                  <span className="text-amber-500 font-medium">By Appointment</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500">
              <h2 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-6 tracking-wide">Follow Us</h2>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-full bg-stone-800/50 hover:bg-amber-500/20 border border-stone-700/50 hover:border-amber-500/50 flex items-center justify-center transition-all group">
                  <Instagram className="w-5 h-5 text-stone-400 group-hover:text-amber-500" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-stone-800/50 hover:bg-amber-500/20 border border-stone-700/50 hover:border-amber-500/50 flex items-center justify-center transition-all group">
                  <Facebook className="w-5 h-5 text-stone-400 group-hover:text-amber-500" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-stone-800/50 hover:bg-amber-500/20 border border-stone-700/50 hover:border-amber-500/50 flex items-center justify-center transition-all group">
                  <MessageCircle className="w-5 h-5 text-stone-400 group-hover:text-amber-500" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-10 rounded-2xl hover:border-amber-500/30 transition-all duration-500">
              <h2 className="font-serif text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-8 tracking-wide">Send us a Message</h2>

              {submitted ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="font-serif text-2xl text-white mb-2">Message Sent!</h3>
                  <p className="text-stone-400 detail-text">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-stone-300 text-sm mb-2 tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black/30 border border-stone-700/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:bg-black/50 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 text-sm mb-2 tracking-wide">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-black/30 border border-stone-700/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:bg-black/50 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-300 text-sm mb-2 tracking-wide">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-black/30 border border-stone-700/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:bg-black/50 outline-none transition-all"
                      placeholder="Inquiry about artwork"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 text-sm mb-2 tracking-wide">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-black/30 border border-stone-700/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:bg-black/50 outline-none transition-all resize-none detail-text"
                      placeholder="Tell us about your interest..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl uppercase tracking-[0.3em] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
