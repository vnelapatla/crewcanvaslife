package com.crewcanvas.config;

import com.crewcanvas.model.MovieQuizQuestion;
import com.crewcanvas.repository.MovieQuizQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class MovieQuizDataInitializer implements CommandLineRunner {

    @Autowired
    private MovieQuizQuestionRepository repository;

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() == 0) {
            List<MovieQuizQuestion> defaultQuestions = Arrays.asList(
                createQuestion("In Pushpa, what does Allu Arjun say before “Taggede Le”?", 
                    "Pushpa ante flower anukuntiva?", "Pushpa ante fireuuuu!", "Pushpa ante mass ra!", "Pushpa ante king ra!", "B"),
                
                createQuestion("Which hero is famous for walking in slow motion even when there is no wind?", 
                    "Nani", "Balakrishna", "Mahesh Babu", "Prabhas", "C"),
                
                createQuestion("Which hero’s dance makes people try steps at weddings and immediately regret it?", 
                    "Allu Arjun", "Venkatesh", "Sunil", "Jagapathi Babu", "A"),
                
                createQuestion("In Tollywood memes, who is known for “physics-defying” action scenes?", 
                    "Nani", "Balakrishna", "Siddhu Jonnalagadda", "Sharwanand", "B"),
                
                createQuestion("Which movie gave us the famous dialogue “Nenu once decide ayithe…”?", 
                    "Pokiri", "Businessman", "Gabbar Singh", "Temper", "C"),
                
                createQuestion("Which Telugu movie hero worked as a doctor before becoming an actor?", 
                    "Ravi Teja", "Sumanth", "Rajasekhar", "Ram Pothineni", "C"),
                
                createQuestion("In RRR, what are the names of the characters played by Ram Charan and Jr. NTR?", 
                    "Pushpa & Srivalli", "Bheem & Ramaraju", "Vikram & Aditya", "Krishna & Arjun", "B"),
                
                createQuestion("Which director is known for taking years to complete one film but making it huge?", 
                    "Sukumar", "Trivikram Srinivas", "Koratala Siva", "S. S. Rajamouli", "D"),
                
                createQuestion("Which Telugu actor acted in the highest number of dual roles in his career?", 
                    "Chiranjeevi", "Krishna", "NTR", "ANR", "B"),
                
                createQuestion("Which was the first Telugu movie nominated for the Oscars in the Best Foreign Language Film category from India?", 
                    "Baahubali", "Swathi Muthyam", "RRR", "Sankarabharanam", "B")
            );
            
            repository.saveAll(defaultQuestions);
            System.out.println("✅ Movie Quiz: 10 Default questions initialized.");
        }
    }

    private MovieQuizQuestion createQuestion(String text, String a, String b, String c, String d, String correct) {
        MovieQuizQuestion q = new MovieQuizQuestion();
        q.setQuestionText(text);
        q.setOptionA(a);
        q.setOptionB(b);
        q.setOptionC(c);
        q.setOptionD(d);
        q.setCorrectOption(correct);
        return q;
    }
}
