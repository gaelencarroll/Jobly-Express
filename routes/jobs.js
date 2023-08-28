const express = require('express')
const Job = require('../models/job')
const jsonschema = require('jsonschema')
const {BadRequestError} = require('../expressError')
const jobNewSchema = require('../schemas/jobNew.json')
const jobSearchSchema = require('../schemas/jobSearch.json')
const jobUpdateSchema = require('../schemas/jobUpdate.json')
const {ensureAdmin} = require('../middleware/auth')

const router = express.Router({mergeParams: true})

router.post('/', ensureAdmin, async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema)
        if(!validator.valid){
            const errors = validator.errors.map(err => err.stack)
            throw new BadRequestError(errors)
        }
        const job = await Job.create(req.body)
        return res.status(201).json({job})
    }
    catch(err){
        return next(err)
    }
})

router.get('/',async function(req,res,next){
    const quer = req.query
    if(quer.minSalary !== undefined){
        quer.minSalary = +quer.minSalary;
    }
    quer.hasEquity = quer.hasEquity === 'true';
    try{
        const validator = jsonschema.validate(quer, jobSearchSchema)
        if(!validator.valid){
            const err = validator.errors.map(e => e.stack)
            throw new BadRequestError(err)
        }
        else{
            const jobs = await Job.findAll(quer)
            return res.json({jobs})
        }
    }
    catch(err){
        return next(err)
    }
})

router.get('/:id', async function(req,res,next){
    try{
        const job = await Job.get(req.params.id)
        return res.json({job})
    }
    catch(err){
        return next(err)
    }
})

router.patch('/:id', ensureAdmin, async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, jobUpdateSchema)
        if(!validator.valid){
            const err = validator.errors.map(e => e.stack)
            throw new BadRequestError(err)
        }
        const job = await Job.update(req.params.id, req.body)
        return res.json({job})
    }
    catch(err){
        return next(err)
    }
})

router.delete('/:id', ensureAdmin, async function(req,res,next){
    try{
        await Job.remove(req.params.id)
        const result = res.json({deleted: +req.params.id})
        return result
    }
    catch(err){
        return next(err)
    }
})

module.exports = router;