import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: "Is this real money or just points?",
    answer: "Solar Credits are a digital representation of clean energy contribution. While they're not currency, they can be used to offset electricity bills or traded on our marketplace. The value is real — 1 credit = ₹3 savings on your bill."
  },
  {
    question: "Can I earn monthly income from this?",
    answer: "If you're a solar producer with excess energy, you can list your credits on the marketplace for other users to buy. This creates a passive income stream from your solar installation."
  },
  {
    question: "Do I need solar panels to use SolarCredit?",
    answer: "No! Consumers can buy credits from producers to offset their bills and support clean energy — no installation required. You just need to sign up and purchase credits from the marketplace."
  },
  {
    question: "Is this carbon trading?",
    answer: "Not exactly. While credits represent environmental impact (1 credit = 1 kg CO₂ avoided), SolarCredit is focused on peer-to-peer energy value exchange, not formal carbon offset markets."
  },
  {
    question: "Is this legally approved?",
    answer: "SolarCredit is designed with Indian energy policies in mind. We're building towards compliance with net metering regulations and renewable energy guidelines. Always consult local regulations for your area."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Smart FAQ
        </h2>
        
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="text-center mt-8">
          <Link 
            to="#" 
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            Clarify through SolarGPT
          </Link>
        </div>
      </div>
    </section>
  );
}
