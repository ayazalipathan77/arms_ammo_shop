import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, Globe, Instagram, Facebook, MessageCircle } from 'lucide-react';
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
    <div className="pt-24 pb-20 min-h-screen relative overflow-hidden px-6 md:px-12">
      {/* Background Gradient Orbs - Static */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-radial from-tangerine/30 via-tangerine/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-radial from-amber/20 via-amber/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1920px] mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-pearl/10 pb-8 high-contrast:border-black/20">
            <div>
              <h1 className="text-4xl md:text-7xl font-display font-bold text-pearl high-contrast:text-black mb-2">
                CONTACT
              </h1>
              <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
                Get in Touch
              </p>
            </div>
          </div>
        </motion.div>

        <div className="py-16 px-6 md:px-12 relative overflow-hidden bg-gradient-to-bl from-void via-charcoal to-void border-t border-pearl/10 rounded-sm">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-tangerine/25 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-charcoal/30 backdrop-blur-sm border border-pearl/10 p-8 rounded-sm hover:border-tangerine/30 transition-all duration-500">
              <h2 className="font-display text-2xl text-pearl mb-8 tracking-wide uppercase">Visit Our Gallery</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tangerine/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-tangerine" />
                  </div>
                  <div>
                    <h3 className="text-pearl font-mono uppercase tracking-widest text-xs mb-1">Address</h3>
                    <p className="text-warm-gray text-sm font-mono leading-relaxed">
                      DHA Phase 6, Lahore<br />
                      Punjab, Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tangerine/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-tangerine" />
                  </div>
                  <div>
                    <h3 className="text-pearl font-medium mb-1 tracking-wide">Phone</h3>
                    <p className="text-warm-gray text-sm detail-text">+92 300 123 4567</p>
                    <p className="text-warm-gray text-sm detail-text">+92 42 3456 7890</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tangerine/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-tangerine" />
                  </div>
                  <div>
                    <h3 className="text-pearl font-medium mb-1 tracking-wide">Email</h3>
                    <p className="text-warm-gray text-sm detail-text">support@muraqqa.art</p>
                    <p className="text-warm-gray text-sm detail-text">gallery@muraqqa.art</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tangerine/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-tangerine" />
                  </div>
                  <div>
                    <h3 className="text-pearl font-medium mb-1 tracking-wide">Website</h3>
                    <p className="text-warm-gray text-sm detail-text">www.muraqqa.art</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Hours */}
            <div className="bg-charcoal/30 backdrop-blur-sm border border-pearl/10 p-8 rounded-sm hover:border-tangerine/30 transition-all duration-500">
              <h2 className="font-display text-2xl text-pearl mb-6 tracking-wide uppercase">Gallery Hours</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-warm-gray">Monday - Friday</span>
                  <span className="text-pearl font-medium">10:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-gray">Saturday</span>
                  <span className="text-pearl font-medium">11:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-gray">Sunday</span>
                  <span className="text-tangerine font-medium">By Appointment</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-charcoal/30 backdrop-blur-sm border border-pearl/10 p-8 rounded-sm hover:border-tangerine/30 transition-all duration-500">
              <h2 className="font-display text-2xl text-pearl mb-6 tracking-wide uppercase">Follow Us</h2>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-full bg-charcoal hover:bg-tangerine/20 border border-pearl/10 hover:border-tangerine/50 flex items-center justify-center transition-all group">
                  <Instagram className="w-5 h-5 text-warm-gray group-hover:text-tangerine" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-charcoal hover:bg-tangerine/20 border border-pearl/10 hover:border-tangerine/50 flex items-center justify-center transition-all group">
                  <Facebook className="w-5 h-5 text-warm-gray group-hover:text-tangerine" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-charcoal hover:bg-tangerine/20 border border-pearl/10 hover:border-tangerine/50 flex items-center justify-center transition-all group">
                  <MessageCircle className="w-5 h-5 text-warm-gray group-hover:text-tangerine" />
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
            <div className="bg-charcoal/30 backdrop-blur-sm border border-pearl/10 p-10 rounded-sm hover:border-tangerine/30 transition-all duration-500">
              <h2 className="font-display text-3xl text-pearl mb-8 tracking-wide uppercase">Send us a Message</h2>

              {submitted ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="font-serif text-2xl text-pearl mb-2">Message Sent!</h3>
                  <p className="text-warm-gray detail-text">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-pearl text-xs font-mono uppercase tracking-widest mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-void border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine focus:bg-charcoal/50 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-pearl text-xs font-mono uppercase tracking-widest mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-void border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine focus:bg-charcoal/50 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-pearl text-xs font-mono uppercase tracking-widest mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-void border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine focus:bg-charcoal/50 outline-none transition-all"
                      placeholder="Inquiry about artwork"
                    />
                  </div>

                  <div>
                    <label className="block text-pearl text-xs font-mono uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-void border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine focus:bg-charcoal/50 outline-none transition-all resize-none detail-text"
                      placeholder="Tell us about your interest..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-tangerine hover:bg-amber text-void py-4 rounded-sm uppercase tracking-[0.3em] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
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
    </div>
  );
};
