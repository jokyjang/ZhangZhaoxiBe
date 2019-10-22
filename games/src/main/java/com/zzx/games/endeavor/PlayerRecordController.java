package com.zzx.games.endeavor;

import com.zzx.games.models.PlayRecord;
import com.zzx.games.models.PlayRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/endeavor")
public class PlayerRecordController {
    @Autowired
    private PlayRecordRepository repository;

    @GetMapping("/playRecords")
    public Iterable<PlayRecord> listPlayRecords() {
        return repository.findAll();
    }

    @PostMapping("/playRecord")
    public PlayRecord createPlayRecord(@RequestBody PlayRecord record) {
        return repository.save(record);
    }
}
