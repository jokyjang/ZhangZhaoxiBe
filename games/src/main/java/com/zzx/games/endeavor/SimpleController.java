package com.zzx.games.endeavor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SimpleController {
    @Value("${spring.application.name}")
    private String appName;

    @GetMapping("/endeavor")
    public String homePage(Model model) {
        model.addAttribute("appName", appName);
        return "home";
    }
}
